import { useServices } from './app/services';
import { PerfStats } from './ui/PerfStats';
import { PriceRow } from './ui/PriceRow';
import { StatusBar } from './ui/StatusBar';

export default function App() {
  const { symbols } = useServices();
  return (
    <main>
      <h1>Crypto ticker</h1>
      <StatusBar />
      <PerfStats />
      <table>
        <thead>
          <tr>
            <th>Pair</th>
            <th>Best bid</th>
            <th>Spread</th>
            <th>Best ask</th>
            <th>Venues</th>
          </tr>
        </thead>        <tbody>
          {symbols.map((symbol) => (
            <PriceRow key={symbol} symbol={symbol} />
          ))}
        </tbody>
      </table>
    </main>
  );
}