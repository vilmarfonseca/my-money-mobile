// Synced from my-money-v2 (src/lib/settings/settings-data.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
export const profileDefaults = {
  fullName: "Sample user",
  email: "info@mymoneyapp.io",
  username: "mymoneyapp",
  phone: "+1 (415) 555-0198",
  monthlyIncomeTarget: "$7,200",
  savingsGoal: "22%",
};

export const appPreferenceDefaults = {
  fullScreenMode: true,
  budgetAlerts: true,
  billReminders: true,
  weeklySummary: false,
  privacyMode: false,
};

export const defaultCurrencies = [
  { label: "USD - US dollar", value: "USD" },
  { label: "BRL - Brazilian real", value: "BRL" },
  { label: "EUR - Euro", value: "EUR" },
] as const;

export const languageOptions = [
  { label: "Portuguese (Brazil)", value: "pt-BR" },
  { label: "English", value: "en-US" },
] as const;

export const themeOptions = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
] as const;
