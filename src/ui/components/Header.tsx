import { useServices } from '../../app/services';
import { PerfStats } from './PerfStats';
import { ProviderStatusList } from './ProviderStatusList';

/** Modes switch by URL (a reload restarts the feed cleanly), so every mode is also a shareable link. */
const MODES = [
  { label: 'Live exchanges', href: '?', active: (mode: string) => mode === 'live' },
  { label: 'Stress 100/s', href: '?mode=stress&rate=100', active: (mode: string, rate: number) => mode === 'stress' && rate < 1000 },
  { label: 'Stress 3,000/s', href: '?mode=stress&rate=3000', active: (mode: string, rate: number) => mode === 'stress' && rate >= 1000 },
];

export function Header() {
  const { config } = useServices();

  return (
    <header className="header">
      <div className="header-main">
        <h1 className="brand">Crypto ticker</h1>
        <nav className="segmented" aria-label="Price source">
          {MODES.map((m) => (
            <a key={m.label} href={m.href} aria-current={m.active(config.mode, config.stressRate) ? 'page' : undefined}>
              {m.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="header-meta">
        <ProviderStatusList />
        <PerfStats />
      </div>
    </header>
  );
}
