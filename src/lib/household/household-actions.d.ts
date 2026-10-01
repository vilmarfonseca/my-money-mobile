// Synced from my-money-v2 (src/lib/household/household-actions.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
export type HouseholdActionResult = {
    ok: true;
} | {
    ok: false;
    message: string;
};
export declare function createHousehold(name: string, options?: {
    /** Switch into the new household right away (default). Onboarding
     * passes false so the user keeps setting up their personal data. */
    activate?: boolean;
}): Promise<HouseholdActionResult>;
export declare function renameHousehold(name: string): Promise<HouseholdActionResult>;
export declare function switchWorkspace(householdId: string | null): Promise<HouseholdActionResult>;
export declare function inviteToHousehold(email: string): Promise<HouseholdActionResult>;
export declare function revokeInvitation(invitationId: string): Promise<HouseholdActionResult>;
export declare function removeMember(memberUserId: string): Promise<HouseholdActionResult>;
export declare function leaveHousehold(): Promise<HouseholdActionResult>;
export declare function deleteHousehold(): Promise<HouseholdActionResult>;
/**
 * Accepts an invite by token. On success sets the household as the active
 * workspace and redirects to the dashboard.
 */
export declare function acceptInvitation(token: string): Promise<HouseholdActionResult>;
