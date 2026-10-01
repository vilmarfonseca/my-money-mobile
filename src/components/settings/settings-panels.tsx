import { Image } from 'expo-image';
import {
  Bell,
  CalendarClock,
  Check,
  EyeOff,
  LogOut,
  Mail,
  MonitorUp,
  Save,
  type LucideIcon,
} from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, View, type KeyboardTypeOptions, type LayoutChangeEvent } from 'react-native';

import { useApiAction } from '@/api/hooks';
import { PageHeader } from '@/components/page-header';
import { attempt } from '@/components/settings/action-result';
import { BillingSection } from '@/components/settings/billing-section';
import {
  CalendarIntegrationCard,
  type CalendarIntegrationCardProps,
} from '@/components/settings/calendar-integration-card';
import { DeleteAccountSection } from '@/components/settings/delete-account-section';
import { HouseholdSection } from '@/components/settings/household-section';
import { ReferralSection } from '@/components/settings/referral-section';
import { SectionHeading } from '@/components/settings/section-heading';
import { useSyncedState } from '@/components/settings/use-synced-state';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FieldLabel } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import type { HouseholdSettingsData } from '@/lib/household/household-queries';
import { useI18n } from '@/lib/i18n/provider';
import type { ReferralSummary } from '@/lib/referrals/referral-queries';
import { defaultCurrencies, languageOptions, themeOptions } from '@/lib/settings/settings-data';
import type {
  CurrencyCode,
  LanguageCode,
  PreferenceKey,
  ThemePreference,
  UserSettings,
} from '@/lib/settings/settings-queries';
import { useBootstrap } from '@/providers/app-data-provider';
import { useSession } from '@/providers/auth-provider';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

/** Space between two sections of the page. */
const SECTION_GAP = 28;

export function SettingsPanels({
  calendarIntegration,
  household,
  initialSettings,
  onHouseholdLayout,
  referrals,
}: {
  calendarIntegration: CalendarIntegrationCardProps;
  household: HouseholdSettingsData;
  initialSettings: UserSettings;
  /** Where the household card sits, for the screen's `?section=household`. */
  onHouseholdLayout?: (event: LayoutChangeEvent) => void;
  referrals: ReferralSummary;
}) {
  const { messages } = useI18n();
  const { colors, scheme, setPreference: setAppTheme } = useTheme();
  const { signOut, user } = useSession();
  const { user: account } = useBootstrap();
  const saveProfile = useApiAction('settings.saveProfile');
  const savePreference = useApiAction('settings.savePreference');
  const saveDefault = useApiAction('settings.saveDefault');

  // This form only writes the app's own profile (the identity provider's copy
  // of the name is edited on the web), so the saved name is the one to show.
  const savedName = initialSettings.profile.fullName || user?.name || account.name || '';
  const [fullName, setFullName] = useSyncedState(savedName);
  const [phone, setPhone] = useSyncedState(initialSettings.profile.phone);
  const [preferences, setPreferences] = useSyncedState(
    initialSettings.preferences,
    JSON.stringify(initialSettings.preferences),
  );
  const [currency, setCurrency] = useSyncedState<CurrencyCode>(initialSettings.currency);
  const [language, setLanguage] = useSyncedState<LanguageCode>(initialSettings.language);
  const [theme, setTheme] = useSyncedState<ThemePreference>(initialSettings.theme);
  const [savingPreferenceKey, setSavingPreferenceKey] = useState<PreferenceKey | null>(null);
  const [savingDefaultKey, setSavingDefaultKey] = useState<
    'currency' | 'language' | 'theme' | null
  >(null);

  const username = user?.username ?? initialSettings.profile.username;
  const email = user?.email ?? (initialSettings.profile.email || account.email);

  const preferenceRows: Array<{
    key: PreferenceKey;
    title: string;
    description: string;
    icon: LucideIcon;
  }> = [
    {
      key: 'fullScreenMode',
      title: messages.settings.enableFullScreen,
      description: messages.settings.enableFullScreenDescription,
      icon: MonitorUp,
    },
    {
      key: 'budgetAlerts',
      title: messages.settings.budgetAlerts,
      description: messages.settings.budgetAlertsDescription,
      icon: Bell,
    },
    {
      key: 'billReminders',
      title: messages.settings.billReminders,
      description: messages.settings.billRemindersDescription,
      icon: CalendarClock,
    },
    {
      key: 'weeklySummary',
      title: messages.settings.weeklySummary,
      description: messages.settings.weeklySummaryDescription,
      icon: Mail,
    },
    {
      key: 'privacyMode',
      title: messages.settings.hideBalances,
      description: messages.settings.hideBalancesDescription,
      icon: EyeOff,
    },
  ];
  const currencyOptions = defaultCurrencies.map((option) => ({
    label: messages.options.currencies[option.value],
    value: option.value,
  }));
  const localizedLanguageOptions = languageOptions.map((option) => ({
    label: messages.options.languages[option.value],
    value: option.value,
  }));
  const localizedThemeOptions = themeOptions.map((option) => ({
    label: messages.options.themes[option.value],
    value: option.value,
  }));

  const handleProfileSubmit = async () => {
    const result = await attempt(() =>
      saveProfile.run({
        fullName,
        // Not on the form (the web submits them empty as well).
        monthlyIncomeTarget: '',
        phone,
        savingsGoal: '',
      }),
    );

    if (result.ok) {
      toast.success(messages.settings.profileUpdated, {
        description: messages.settings.profileUpdatedApp,
      });
    } else {
      toast.error(messages.settings.profileUpdateFailed, {
        description: result.message,
      });
    }
  };

  const handlePreferenceChange = async (key: PreferenceKey, checked: boolean) => {
    const previousValue = preferences[key];

    setPreferences((current) => ({ ...current, [key]: checked }));
    setSavingPreferenceKey(key);

    const result = await attempt(() => savePreference.run({ key, value: checked }));

    setSavingPreferenceKey((current) => (current === key ? null : current));

    if (!result.ok) {
      setPreferences((current) => ({ ...current, [key]: previousValue }));
      toast.error(messages.settings.preferenceNotSaved, {
        description: result.message,
      });
    }
  };

  const handleCurrencyChange = async (value: CurrencyCode) => {
    const previousValue = currency;
    setCurrency(value);
    setSavingDefaultKey('currency');

    const result = await attempt(() => saveDefault.run({ key: 'currency', value }));
    setSavingDefaultKey((current) => (current === 'currency' ? null : current));

    if (!result.ok) {
      setCurrency(previousValue);
      toast.error(messages.settings.currencyNotSaved, {
        description: result.message,
      });
      return;
    }

    const selected = currencyOptions.find((option) => option.value === value);
    toast.success(messages.settings.currencyUpdated, {
      description: messages.settings.currencySet(selected?.label ?? value),
    });
  };

  const handleLanguageChange = async (value: LanguageCode) => {
    const previousValue = language;
    setLanguage(value);
    setSavingDefaultKey('language');

    const result = await attempt(() => saveDefault.run({ key: 'language', value }));
    setSavingDefaultKey((current) => (current === 'language' ? null : current));

    if (!result.ok) {
      setLanguage(previousValue);
      toast.error(messages.settings.languageNotSaved, {
        description: result.message,
      });
      return;
    }

    const selected = localizedLanguageOptions.find((option) => option.value === value);
    toast.success(messages.settings.languageUpdated, {
      description: messages.settings.languageSet(selected?.label ?? value),
    });
  };

  const handleThemeChange = async (value: ThemePreference) => {
    const previousValue = theme;
    setTheme(value);
    setAppTheme(value);
    setSavingDefaultKey('theme');

    const result = await attempt(() => saveDefault.run({ key: 'theme', value }));
    setSavingDefaultKey((current) => (current === 'theme' ? null : current));

    if (!result.ok) {
      setTheme(previousValue);
      setAppTheme(previousValue);
      toast.error(messages.settings.themeNotSaved, {
        description: result.message,
      });
      return;
    }

    const selected = localizedThemeOptions.find((option) => option.value === value);
    toast.success(messages.settings.themeUpdated, {
      description: messages.settings.appearanceSet(selected?.label ?? value),
    });
  };

  const displayName = fullName || email;

  return (
    <>
      <PageHeader
        titlePrefix={messages.settings.headerTitlePrefix}
        title={messages.settings.headerTitleEmphasis}
        emColor={scheme === 'dark' ? 'ink1' : 'ink2'}
        description={messages.settings.headerDescription}
      />

      <Section>
        <SectionHeading
          eyebrow={messages.settings.profile}
          title={messages.settings.personalInformation}
          description={messages.settings.profileDescription}
        />
        <Card padding={16} style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View
              style={{
                width: 56,
                height: 56,
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.line,
                backgroundColor: colors.accentSoft,
              }}>
              {user?.imageUrl ? (
                <Image
                  accessibilityLabel={messages.settings.profileImageAria}
                  source={{ uri: user.imageUrl }}
                  style={{ width: 56, height: 56 }}
                />
              ) : (
                <Text font="sansSemiBold" size="lg" color="accentSoftFg">
                  {getInitials(displayName)}
                </Text>
              )}
            </View>
            {/* The web has a "change image" button here; the picture is
                managed by the identity provider and stays a web feature. */}
            <View style={{ flex: 1 }}>
              <Text font="sansMedium" size="sm" color="ink2" numberOfLines={1}>
                {displayName}
              </Text>
              {username ? (
                <Text size="xs" color="ink3" numberOfLines={1} style={{ marginTop: 2 }}>
                  @{username}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Phone order: name, [username | phone], email. */}
          <TextField
            label={messages.settings.fullName}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            autoComplete="name"
          />
          <View style={{ flexDirection: 'row', gap: 14 }}>
            <TextField label={messages.settings.username} value={username} disabled style={{ flex: 1 }} />
            <TextField
              label={messages.settings.phone}
              value={phone}
              onChangeText={setPhone}
              autoComplete="tel"
              keyboardType="phone-pad"
              style={{ flex: 1 }}
            />
          </View>
          <TextField label={messages.settings.emailAddress} value={email} disabled />
          <Button
            block
            size="lg"
            label={messages.settings.saveChanges}
            icon={(props) => <Save {...props} />}
            loading={saveProfile.pending}
            onPress={handleProfileSubmit}
          />
        </Card>
      </Section>

      <Section>
        <BillingSection />
      </Section>

      <Section>
        <ReferralSection summary={referrals} />
      </Section>

      <Section>
        <CalendarIntegrationCard {...calendarIntegration} />
      </Section>

      <Section onLayout={onHouseholdLayout}>
        <HouseholdSection data={household} />
      </Section>

      <Section>
        <SectionHeading
          eyebrow={messages.settings.preferences}
          title={messages.settings.appSettings}
          description={messages.settings.tuneDescription}
        />
        <Card padding={16}>
          {/* On phones the theme is a plain labelled segmented field. */}
          <View style={{ gap: 8, paddingTop: 4, paddingBottom: 16 }}>
            <Text font="sansSemiBold" size="2xs" color="ink3" uppercase tracking={0.5}>
              {messages.settings.theme}
            </Text>
            <SegmentedControl
              accessibilityLabel={messages.settings.theme}
              disabled={savingDefaultKey === 'theme'}
              options={localizedThemeOptions}
              size="lg"
              value={theme}
              onValueChange={handleThemeChange}
            />
          </View>
          {preferenceRows.map((preference) => (
            <PreferenceRow
              key={preference.key}
              checked={preferences[preference.key]}
              description={preference.description}
              disabled={savingPreferenceKey === preference.key}
              icon={preference.icon}
              title={preference.title}
              onCheckedChange={(checked) => handlePreferenceChange(preference.key, checked)}
            />
          ))}
        </Card>
      </Section>

      <Section>
        <SectionHeading
          eyebrow={messages.settings.defaults}
          title={messages.settings.financeSetup}
          description={messages.settings.defaultsDescription}
        />
        <Card padding={16} style={{ gap: 20 }}>
          <SegmentedChoice
            label={messages.settings.defaultCurrency}
            disabled={savingDefaultKey === 'currency'}
            options={currencyOptions}
            value={currency}
            onChange={handleCurrencyChange}
          />
          <SegmentedChoice
            label={messages.common.language}
            disabled={savingDefaultKey === 'language'}
            options={localizedLanguageOptions}
            value={language}
            onChange={handleLanguageChange}
          />
        </Card>

        {/* Sign out lives at the end of the page on phones. */}
        <Pressable
          accessibilityRole="button"
          onPress={() => signOut()}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            marginTop: 24,
            paddingVertical: 14,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.line,
            backgroundColor: pressed ? colors.surface2 : colors.surface1,
          })}>
          <LogOut size={16} color={colors.warmSoftFg} />
          <Text font="sansMedium" size="sm" color="warmSoftFg">
            {messages.nav.signOut}
          </Text>
        </Pressable>
      </Section>

      <DeleteAccountSection />
    </>
  );
}

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return 'MM';
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function Section({
  children,
  onLayout,
}: {
  children: ReactNode;
  onLayout?: (event: LayoutChangeEvent) => void;
}) {
  return (
    <View onLayout={onLayout} style={{ marginBottom: SECTION_GAP }}>
      {children}
    </View>
  );
}

function TextField({
  autoCapitalize,
  autoComplete,
  disabled,
  keyboardType,
  label,
  onChangeText,
  style,
  value,
}: {
  autoCapitalize?: 'none' | 'words';
  autoComplete?: 'name' | 'tel';
  disabled?: boolean;
  keyboardType?: KeyboardTypeOptions;
  label: string;
  onChangeText?: (value: string) => void;
  style?: { flex: number };
  value: string;
}) {
  const { colors } = useTheme();

  return (
    <View style={[{ gap: 6 }, style]}>
      <FieldLabel>{label}</FieldLabel>
      <Input
        accessibilityLabel={label}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        editable={!disabled}
        keyboardType={keyboardType}
        value={value}
        onChangeText={onChangeText}
        containerStyle={{ backgroundColor: colors.surface1 }}
      />
    </View>
  );
}

function PreferenceRow({
  checked,
  description,
  disabled,
  icon: Icon,
  onCheckedChange,
  title,
}: {
  checked: boolean;
  description: string;
  disabled?: boolean;
  icon: LucideIcon;
  onCheckedChange: (checked: boolean) => void;
  title: string;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: colors.line,
      }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: radius.sm,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surface2,
        }}>
        <Icon size={16} color={colors.ink2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text font="sansMedium" size="sm">
          {title}
        </Text>
        <Text size="xs" color="ink3" style={{ marginTop: 4, lineHeight: 18 }}>
          {description}
        </Text>
      </View>
      <View style={{ paddingTop: 4 }}>
        <Switch
          checked={checked}
          disabled={disabled}
          accessibilityLabel={title}
          onCheckedChange={onCheckedChange}
        />
      </View>
    </View>
  );
}

function SegmentedChoice<TValue extends string>({
  disabled,
  label,
  onChange,
  options,
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: TValue) => void;
  options: ReadonlyArray<{ readonly label: string; readonly value: TValue }>;
  value: TValue;
}) {
  const { colors } = useTheme();

  return (
    <View style={{ gap: 8 }}>
      <Text font="sansMedium" size="sm" color="ink2">
        {label}
      </Text>
      <View style={{ gap: 8 }}>
        {options.map((option) => {
          const selected = value === option.value;
          const fg = selected ? colors.actionForeground : colors.ink2;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled: Boolean(disabled) }}
              disabled={disabled}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: 40,
                paddingHorizontal: 12,
                borderRadius: radius.xl,
                borderWidth: 1,
                borderColor: selected ? 'transparent' : colors.controlBorder,
                backgroundColor: selected
                  ? colors.action
                  : pressed
                    ? colors.controlHover
                    : colors.control,
                opacity: disabled ? 0.6 : 1,
              })}>
              <Text size="sm" color={fg}>
                {option.label}
              </Text>
              {selected ? <Check size={16} color={fg} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
