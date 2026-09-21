import { useEffect, useState } from 'react';
import type { ProviderQuote } from './core/types';
import { KRAKEN_URL, krakenSubscribe, parseKraken } from './providers/kraken';

export default function App() {
  const [quote, setQuote] = useState<ProviderQuote | null>(null);
  const [status, setStatus] = useState('connecting');
  const [messages, setMessages] = useState(0);

  useEffect(() => {
    const ws = new WebSocket(KRAKEN_URL);

    ws.onopen = () => {
      setStatus('open');
      ws.send(JSON.stringify(krakenSubscribe(['BTC/USD'])));
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      setMessages((n) => n + 1);
      const data: unknown = JSON.parse(event.data);
      const [latest] = parseKraken(data, Date.now());
      if (latest) setQuote(latest);
    };

    ws.onclose = () => setStatus('closed');

    return () => ws.close();
  }, []);

  return (
    <main>
      <h1>Crypto ticker</h1>
      <p>Kraken: {status}</p>
      <p>Messages received: {messages}</p>
      {quote ? (
        <p>
          {quote.symbol} bid {quote.bid} / ask {quote.ask}
        </p>
      ) : (
        <p>Waiting for price</p>
      )}
    </main>
  );
}