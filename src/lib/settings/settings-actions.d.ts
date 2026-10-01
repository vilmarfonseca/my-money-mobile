// Synced from my-money-v2 (src/lib/settings/settings-actions.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import { type DefaultSettingsInput, type PreferenceSettingsInput, type ProfileSettingsInput } from "@/lib/settings/settings-queries";
type SettingsActionResult = {
    ok: true;
} | {
    ok: false;
    message: string;
};
export declare function saveProfileSettings(input: ProfileSettingsInput): Promise<SettingsActionResult>;
export declare function savePreferenceSetting(input: PreferenceSettingsInput): Promise<SettingsActionResult>;
export declare function saveDefaultSetting(input: DefaultSettingsInput): Promise<SettingsActionResult>;
export {};
