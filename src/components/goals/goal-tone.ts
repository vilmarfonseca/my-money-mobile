import type { GoalActivity } from '@/lib/goals/goals-data';
import type { ThemeColors } from '@/theme/tokens';

/**
 * Icon-tile colours of a goal tone: the web's `getIconToneClassName`, which
 * every goals component repeats, resolved against the current theme.
 */
export function goalToneColors(tone: GoalActivity['tone'], colors: ThemeColors) {
  if (tone === 'coral') return { bg: colors.warmSoft, fg: colors.warmSoftFg };
  if (tone === 'sage') return { bg: colors.positiveSoft, fg: colors.positiveFg };
  if (tone === 'amber') return { bg: colors.warningSoft, fg: colors.warning };
  if (tone === 'ink') return { bg: colors.action, fg: colors.actionForeground };
  return { bg: colors.accentSoft, fg: colors.accentSoftFg };
}
