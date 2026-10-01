// Synced from my-money-v2 (src/lib/account/deletion-reasons.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
/**
 * Why a user deletes their account, asked on the locked /subscribe screen
 * before the deletion goes through. The chosen reason (plus free text) is
 * emailed to the support inbox so churn has a paper trail.
 */
export const DELETION_REASONS = [
  "too_expensive",
  "missing_features",
  "too_much_manual_work",
  "no_time_to_try",
  "using_another_app",
  "privacy_concerns",
  "other",
] as const;

export type DeletionReason = (typeof DELETION_REASONS)[number];

export function isDeletionReason(value: unknown): value is DeletionReason {
  return DELETION_REASONS.includes(value as DeletionReason);
}

/** Inbox-facing labels (the support inbox reads English). */
export const deletionReasonLabels: Record<DeletionReason, string> = {
  too_expensive: "Too expensive",
  missing_features: "Missing a feature I need",
  too_much_manual_work: "Too much manual entry",
  no_time_to_try: "Didn't have time to try it",
  using_another_app: "Using another app",
  privacy_concerns: "Privacy concerns",
  other: "Other",
};
