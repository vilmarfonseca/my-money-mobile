import {
  useQuery,
  useQueryClient,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import {
  ApiError,
  callApi,
  type ApiArgs,
  type ApiResult,
  type MobileApiMethod,
} from '@/api/client';

type QueryOptions<M extends MobileApiMethod> = Omit<
  UseQueryOptions<ApiResult<M>, ApiError>,
  'queryKey' | 'queryFn'
>;

/** Reads one API method; cached by method name and arguments. */
export function useApiQuery<M extends MobileApiMethod>(
  method: M,
  args: ApiArgs<M>,
  options?: QueryOptions<M>,
): UseQueryResult<ApiResult<M>, ApiError> {
  return useQuery<ApiResult<M>, ApiError>({
    queryKey: [method, ...args],
    queryFn: () => callApi(method, ...args),
    ...options,
  });
}

/**
 * `useApiQuery` for a screen: also refreshes stale data whenever the screen
 * comes back into focus. Tabs stay mounted, so without this a tab would keep
 * showing what it loaded the first time; the web app gets the same effect by
 * re-rendering the page on every navigation.
 */
export function useScreenQuery<M extends MobileApiMethod>(
  method: M,
  args: ApiArgs<M>,
  options?: QueryOptions<M>,
): UseQueryResult<ApiResult<M>, ApiError> {
  const query = useApiQuery(method, args, options);
  const queryClient = useQueryClient();
  const queryKey = JSON.stringify([method, ...args]);

  useFocusEffect(
    useCallback(() => {
      // Only data past its stale time is reloaded; a fetch already in flight
      // (the mount's) is joined rather than repeated.
      void queryClient.refetchQueries(
        { queryKey: JSON.parse(queryKey), exact: true, stale: true },
        { cancelRefetch: false },
      );
    }, [queryClient, queryKey]),
  );

  return query;
}

/**
 * Marks everything loaded so far as stale and reloads what is on screen. The
 * native counterpart of `router.refresh()` after a server action.
 */
export function useRefreshData() {
  const queryClient = useQueryClient();
  return useCallback(() => queryClient.invalidateQueries(), [queryClient]);
}

/**
 * Runs an API action and refreshes the app's data afterwards, tracking the
 * in-flight state for the button that triggered it:
 *
 *   const createGoal = useApiAction('goals.create');
 *   const result = await createGoal.run(input);
 *   if (!result.ok) toast.error(result.message);
 *
 * Actions answer `{ ok: false, message }` for expected failures; `run` only
 * throws (an `ApiError`) when the request itself fails.
 */
export function useApiAction<M extends MobileApiMethod>(method: M) {
  const refresh = useRefreshData();
  const [pending, setPending] = useState(false);

  const run = useCallback(
    async (...args: ApiArgs<M>): Promise<ApiResult<M>> => {
      setPending(true);
      try {
        const result = await callApi(method, ...args);
        void refresh();
        return result;
      } finally {
        setPending(false);
      }
    },
    [method, refresh],
  );

  return { pending, run };
}

/** Pull-to-refresh state for a screen's queries. */
export function usePullToRefresh(...queries: Array<{ refetch: () => Promise<unknown> }>) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all(queries.map((query) => query.refetch()));
    } finally {
      setRefreshing(false);
    }
  };

  return { onRefresh, refreshing };
}
