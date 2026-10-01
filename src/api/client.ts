import { webUrl } from '@/api/config';
import type { MobileApi, MobileApiMethod } from '@/lib/mobile/api';
import { decodeWire, encodeWire } from '@/lib/mobile/wire';

export type { MobileApiMethod };
export type ApiArgs<M extends MobileApiMethod> = Parameters<MobileApi[M]>;
export type ApiResult<M extends MobileApiMethod> = Awaited<ReturnType<MobileApi[M]>>;

/** A non-2xx answer from the API, or a request that never reached it. */
export class ApiError extends Error {
  constructor(
    /** HTTP status, or 0 when the request failed before getting one. */
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type TokenGetter = () => Promise<string | null>;
let getToken: TokenGetter = async () => null;

/** Installed once by the auth provider; every call asks for a fresh token. */
export function setApiTokenGetter(getter: TokenGetter) {
  getToken = getter;
}

/**
 * Calls one entry of the web app's `mobileApi` registry. The native
 * counterpart of calling a query or a server action on the web: same name,
 * same arguments, same result.
 */
export async function callApi<M extends MobileApiMethod>(
  method: M,
  ...args: ApiArgs<M>
): Promise<ApiResult<M>> {
  let response: Response;
  try {
    const token = await getToken();
    response = await fetch(`${webUrl}/api/mobile/rpc/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ args: encodeWire(args) }),
    });
  } catch (error) {
    throw new ApiError(0, error instanceof Error ? error.message : 'Network request failed');
  }

  let body: { data?: unknown; error?: { message?: string } } | null = null;
  try {
    body = await response.json();
  } catch {
    // A non-JSON body (proxy error page, HTML) is reported by status below.
  }

  if (!response.ok || !body) {
    throw new ApiError(response.status, body?.error?.message ?? `Request failed (${response.status})`);
  }

  return decodeWire(body.data) as ApiResult<M>;
}
