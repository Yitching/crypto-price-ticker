import { useServices } from '../app/services';
import { useValue } from '../store/hooks';

export function StatusBar() {
  const { feed, statuses } = useServices();
  const all = useValue(statuses);
  const providerStatuses = Object.entries(all)
    .map(([provider, state]) => `${provider}: ${state}`)
    .join(' · ');

  return (
    <p>
      Feed: {feed.runsIn}
      {providerStatuses && ` · ${providerStatuses}`}
    </p>
  );
}
