// Synced from my-money-v2 (src/lib/household/household-queries.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
export type HouseholdMemberRow = {
    userId: string;
    name: string | null;
    email: string;
    role: "owner" | "member";
    joinedAt: string;
};
export type HouseholdInvitationRow = {
    id: string;
    email: string;
    createdAt: string;
    expiresAt: string;
};
export type HouseholdSettingsData = {
    household: {
        id: string;
        name: string;
        role: "owner" | "member";
    } | null;
    members: HouseholdMemberRow[];
    pendingInvitations: HouseholdInvitationRow[];
    /** Premium gate: whether this user may create a household. */
    canCreateHousehold: boolean;
    currentUserId: string;
};
export type WorkspaceOption = {
    kind: "personal";
    balance: number;
} | {
    kind: "household";
    householdId: string;
    name: string;
    role: "owner" | "member";
    memberCount: number;
    balance: number;
};
export type WorkspaceOptionsData = {
    options: WorkspaceOption[];
    activeHouseholdId: string | null;
    canCreateHousehold: boolean;
};
/**
 * Premium gate: shared households require the Premium tier. The flag flows
 * into the settings card and the onboarding household step.
 */
export declare function userHasPremium(user: {
    id: string;
}): Promise<boolean>;
export declare function getHouseholdSettingsData(): Promise<HouseholdSettingsData>;
/** Personal + every household the user belongs to, for the switcher. */
export declare function getWorkspaceOptions(): Promise<WorkspaceOptionsData>;
export type InvitePreview = {
    state: "ready";
    token: string;
    householdName: string;
    inviterName: string;
} | {
    state: "invalid" | "expired" | "revoked" | "accepted";
} | {
    state: "wrongEmail";
    email: string;
};
/** Classifies an invite token for the /invite/[token] page. */
export declare function getInvitePreview(token: string): Promise<InvitePreview>;
