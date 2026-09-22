import { useServices } from '../../app/services';
import { providerLabel } from '../../config/providers';
import type { ConnectionState } from '../../core/types';
import { useValue } from '../../store/hooks';

const STATE_TEXT: Record<ConnectionState, string> = {
  connecting: 'Connecting',
  open: 'Connected',
  reconnecting: 'Reconnecting',
  closed: 'Disconnected',
};

export function ProviderStatusList() {
  const { statuses } = useServices();
  const entries = Object.entries(useValue(statuses)).sort(([a], [b]) => a.localeCompare(b));

  if (entries.length === 0) return <p className="providers-empty">Connecting to providers</p>;

  return (
    <ul className="providers" aria-label="Provider connections">
      {entries.map(([provider, s]) => (
        <li
          key={provider}
          data-state={s.state}
          title={s.detail ? `${STATE_TEXT[s.state]}: ${s.detail}` : STATE_TEXT[s.state]}
        >
          <span className="dot" aria-hidden="true" />
          {providerLabel(provider)}
          <span className="sr-only">: {STATE_TEXT[s.state]}</span>
        </li>
      ))}
    </ul>
  );
}
