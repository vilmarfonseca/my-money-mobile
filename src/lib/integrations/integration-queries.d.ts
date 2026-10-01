// Synced from my-money-v2 (src/lib/integrations/integration-queries.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import { type SyncableType } from "@/lib/integrations/google-calendar/types";
/**
 * Client-safe view of the calendar integration for the settings card. Never
 * includes tokens — only whether a connection exists and its display state.
 */
export type CalendarIntegrationView = {
    connected: boolean;
    /** Whether the server has Google OAuth credentials configured at all. */
    configured: boolean;
    /** Whether the current user is entitled to use the feature (premium gate). */
    entitled: boolean;
    accountEmail: string | null;
    syncTypes: SyncableType[];
    lastSyncedAt: string | null;
};
export declare function getCalendarIntegrationView(): Promise<CalendarIntegrationView>;
