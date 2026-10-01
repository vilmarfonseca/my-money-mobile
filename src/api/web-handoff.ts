import * as WebBrowser from 'expo-web-browser';

import { callApi } from '@/api/client';
import { webUrl } from '@/api/config';

/**
 * Flows that finish on someone else's page (Stripe Checkout and its billing
 * portal, Google's consent screen) run in the web app. These are the web
 * routes the native app may hand off to.
 */
export type WebFlowPath =
  | `/api/billing/checkout?plan=${string}&interval=${string}`
  | '/api/billing/payment-method'
  | '/api/billing/portal'
  | '/api/billing/portal?flow=update'
  | '/api/billing/portal?flow=payment'
  | '/api/integrations/google-calendar/connect';

/**
 * Opens one of the web app's hosted flows in an in-app browser, signed in as
 * the current user through a single-use link, and resolves when the browser
 * is closed. Callers refresh their data afterwards.
 */
export async function openWebFlow(path: WebFlowPath): Promise<void> {
  const { url } = await callApi('web.handoffUrl', path);
  await WebBrowser.openBrowserAsync(url, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
  });
}

/** Opens a public page of the web app (the user guide, the privacy policy). */
export async function openWebPage(path: string): Promise<void> {
  await WebBrowser.openBrowserAsync(`${webUrl}${path}`, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
  });
}
