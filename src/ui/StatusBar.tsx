import { useServices } from '../app/services';
import { useValue } from '../store/hooks';

export function StatusBar() {
  const { statuses } = useServices();
  const all = useValue(statuses);
  return (
    <p>
      {Object.entries(all)
        .map(([provider, state]) => `${provider}: ${state}`)
        .join(' · ')}
    </p>
  );
}