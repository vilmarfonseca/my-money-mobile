// Synced from my-money-v2 (src/lib/settings/settings-queries.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import { type AppLocale } from "@/lib/i18n/config";
import { appPreferenceDefaults, defaultCurrencies, languageOptions, profileDefaults, themeOptions } from "@/lib/settings/settings-data";
export type AppPreferences = typeof appPreferenceDefaults;
export type PreferenceKey = keyof AppPreferences;
export type CurrencyCode = (typeof defaultCurrencies)[number]["value"];
export type LanguageCode = (typeof languageOptions)[number]["value"];
export type ThemePreference = (typeof themeOptions)[number]["value"];
export type UserSettings = {
    profile: typeof profileDefaults;
    preferences: AppPreferences;
    currency: CurrencyCode;
    language: AppLocale;
    theme: ThemePreference;
};
export type ProfileSettingsInput = Pick<typeof profileDefaults, "fullName" | "phone" | "monthlyIncomeTarget" | "savingsGoal">;
export type PreferenceSettingsInput = {
    key: PreferenceKey;
    value: boolean;
};
export type DefaultSettingsInput = {
    key: "currency";
    value: CurrencyCode;
} | {
    key: "language";
    value: AppLocale;
} | {
    key: "theme";
    value: ThemePreference;
};
export type UserDisplayPreferences = {
    currency: CurrencyCode;
    locale: AppLocale;
    theme: ThemePreference;
};
export declare function getUserSettings(): Promise<UserSettings>;
export declare function getUserThemePreference(): Promise<ThemePreference>;
export declare function getUserDisplayPreferences(): Promise<UserDisplayPreferences>;
export declare function updateProfileSettings(input: ProfileSettingsInput): Promise<void>;
export declare function updatePreferenceSetting(input: PreferenceSettingsInput): Promise<void>;
export declare function updateDefaultSetting(input: DefaultSettingsInput): Promise<void>;
