import { useDeferredValue, useMemo, useState } from 'react';
import { useServices } from './app/services';
import { Blotter } from './ui/components/Blotter';
import { Header } from './ui/components/Header';
import { PriceBoard } from './ui/components/PriceBoard';
import { PriceTile } from './ui/components/PriceTile';
import { TradeTicket } from './ui/components/TradeTicket';

type View = 'tiles' | 'board';

const VIEWS: readonly { view: View; label: string }[] = [
  { view: 'tiles', label: 'Tiles' },
  { view: 'board', label: 'Board' },
];

export default function App() {
  const { instruments, config } = useServices();
  const [view, setView] = useState<View>('tiles');
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const deferredFilter = useDeferredValue(filter);

  const visible = useMemo(() => {
    const query = deferredFilter.trim().toUpperCase();
    return query ? instruments.filter((i) => i.symbol.includes(query)) : instruments;
  }, [instruments, deferredFilter]);

  // Fall back to the first visible pair if the selection is filtered out.
  const selectedInstrument = visible.find((i) => i.symbol === selected) ?? visible[0];

  return (
    <div className="app">
      <Header />
      <main className="workspace">
        <section className="prices" aria-label="Prices">
          <div className="toolbar">
            <div className="segmented" role="group" aria-label="Layout">
              {VIEWS.map((v) => (
                <button key={v.view} type="button" aria-pressed={view === v.view} onClick={() => setView(v.view)}>
                  {v.label}
                </button>
              ))}
            </div>
            <label className="filter">
              <span className="sr-only">Filter pairs</span>
              <input
                type="search"
                placeholder="Filter pairs, e.g. ETH"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </label>
            <p className="toolbar-note">
              {config.mode === 'stress'
                ? 'Simulated prices from three test venues.'
                : 'Best bid and ask across Kraken, Coinbase and Binance. USDT is treated as USD.'}
            </p>
          </div>

          {visible.length === 0 ? (
            <p className="empty">
              No pairs match “{filter}”. Clear the filter to see all {instruments.length} pairs.
            </p>
          ) : view === 'board' ? (
            <PriceBoard instruments={visible} selected={selectedInstrument?.symbol} onSelect={setSelected} />
          ) : (
            <div className="tile-grid">
              {visible.map((instrument) => (
                <PriceTile key={instrument.symbol} instrument={instrument} />
              ))}
            </div>
          )}
        </section>

        <aside className="side">
          {view === 'board' && selectedInstrument && (
            <TradeTicket key={selectedInstrument.symbol} instrument={selectedInstrument} />
          )}
          <Blotter />
        </aside>
      </main>
    </div>
  );
}
