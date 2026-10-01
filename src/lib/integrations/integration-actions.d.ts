// Synced from my-money-v2 (src/lib/integrations/integration-actions.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
type ActionResult = {
    ok: true;
} | {
    ok: false;
    message: string;
};
/** Persist which scheduled-item types to sync, then reconcile the calendar. */
export declare function updateCalendarSyncTypes(types: string[]): Promise<ActionResult>;
/** Manual "Sync now" trigger. */
export declare function syncCalendarNow(): Promise<ActionResult>;
/**
 * Disconnects Google Calendar: best-effort removal of the dedicated calendar
 * and token revocation, then deletes the stored connection.
 */
export declare function disconnectGoogleCalendar(): Promise<ActionResult>;
export {};
