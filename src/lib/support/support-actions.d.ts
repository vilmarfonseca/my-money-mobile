// Synced from my-money-v2 (src/lib/support/support-actions.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import { type SupportReason } from "@/lib/support/support-options";
type SupportRequestInput = {
    reason: SupportReason;
    message: string;
};
type SupportActionResult = {
    ok: true;
} | {
    ok: false;
    message: string;
};
export declare function sendSupportMessage(input: SupportRequestInput): Promise<SupportActionResult>;
export {};
