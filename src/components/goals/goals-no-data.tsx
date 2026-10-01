import type { StyleProp, ViewStyle } from 'react-native';

import { CardNoData } from '@/components/card-no-data';
import { useI18n } from '@/lib/i18n/provider';

/** Goals-page flavour of the shared card zero state. */
export function GoalsNoData({ style }: { style?: StyleProp<ViewStyle> }) {
  const { messages } = useI18n();

  return <CardNoData body={messages.goals.noDataBody} style={style} />;
}
