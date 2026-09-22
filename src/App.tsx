import { useServices } from './app/services';
import { Blotter } from './ui/components/Blotter';
import { PriceTile } from './ui/components/PriceTile';
import { PerfStats } from './ui/PerfStats';
import { StatusBar } from './ui/StatusBar';

export default function App() {
  const { instruments } = useServices();
  return (
    <main>
      <h1>Crypto ticker</h1>
      <StatusBar />
      <PerfStats />
      <div className="tile-grid">
        {instruments.map((instrument) => (
          <PriceTile key={instrument.symbol} instrument={instrument} />
        ))}
      </div>
      <Blotter />
    </main>
  );
}
