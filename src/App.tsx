import { SYMBOLS } from './config/symbols';
import { PriceRow } from './ui/PriceRow';
import { StatusBar } from './ui/StatusBar';

export default function App() {
  return (
    <main>
      <h1>Crypto ticker</h1>
      <StatusBar />
      <table>
        <thead>
          <tr>
            <th>Pair</th>
            <th>Best bid</th>
            <th>Spread</th>
            <th>Best ask</th>
            <th>Venues</th>
          </tr>
        </thead>
        <tbody>
          {SYMBOLS.map((symbol) => (
            <PriceRow key={symbol} symbol={symbol} />
          ))}
        </tbody>
      </table>
    </main>
  );
}