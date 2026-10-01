import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { View } from 'react-native';

import { Button, IconButton } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n/provider';

/** Range navigation: the title centered between the arrows, then "Today". */
export function CalendarNav({
  title,
  onPrevious,
  onNext,
  onToday,
}: {
  title: string;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  const { messages } = useI18n();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <IconButton
        accessibilityLabel={messages.calendar.previousRange}
        variant="outline"
        size={36}
        icon={(props) => <ChevronLeft {...props} />}
        onPress={onPrevious}
      />
      {/* The web truncates long week ranges; shrinking keeps them readable. */}
      <Text
        accessibilityRole="header"
        font="display"
        size="2xl"
        tight
        align="center"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
        style={{ flex: 1 }}>
        {title}
      </Text>
      <IconButton
        accessibilityLabel={messages.calendar.nextRange}
        variant="outline"
        size={36}
        icon={(props) => <ChevronRight {...props} />}
        onPress={onNext}
      />
      <Button
        label={messages.calendar.today}
        variant="outline"
        size="sm"
        onPress={onToday}
        style={{ height: 36, paddingHorizontal: 14 }}
      />
    </View>
  );
}
