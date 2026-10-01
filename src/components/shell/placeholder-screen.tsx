import { PageHeader } from '@/components/page-header';
import { CardNoData } from '@/components/card-no-data';
import { Screen } from '@/components/ui/screen';

/** Stand-in for a route that has not been ported yet. */
export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <Screen>
      <PageHeader title={title} />
      <CardNoData body="Not ported yet." />
    </Screen>
  );
}
