import { useCallback, useEffect, useRef, useState } from 'react';
import { useServices } from '../../app/services';
import type { Instrument, Side } from '../../core/types';
import type { Trade } from '../../trading/types';
import { parseAmount } from '../../utils/amount';
import { formatQuantity } from '../../utils/priceFormat';

/**
 * Ticket state and execution for one instrument. Shared by price tiles and
 * the board's docked ticket, so both trade identically.
 */
export function useTradeTicket(instrument: Instrument) {
  const { quotes, trading } = useServices();
  const [amountText, setAmountText] = useState(() =>
    formatQuantity(instrument.defaultAmount, instrument.sizeDecimals),
  );
  const [dealt, setDealt] = useState(instrument.base);
  const [pending, setPending] = useState<Side | null>(null);
  const [result, setResult] = useState<Trade | null>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(clearTimer.current), []);

  const amount = parseAmount(amountText);

  const toggleDealt = useCallback(
    () => setDealt((d) => (d === instrument.base ? instrument.quote : instrument.base)),
    [instrument.base, instrument.quote],
  );

  const execute = useCallback(
    async (side: Side) => {
      // Trade the price that is on screen right now.
      const quote = quotes.get(instrument.symbol);
      const level = side === 'buy' ? quote?.ask : quote?.bid;
      if (!level || amount === null) return;

      setPending(side);
      setResult(null);
      const trade = await trading.submit({
        symbol: instrument.symbol,
        side,
        amount,
        dealtCurrency: dealt,
        price: level.price,
        provider: level.provider,
      });
      setPending(null);
      setResult(trade);
      clearTimeout(clearTimer.current);
      clearTimer.current = setTimeout(() => setResult(null), 5000);
    },
    [quotes, trading, instrument.symbol, amount, dealt],
  );

  return { amountText, setAmountText, amount, dealt, toggleDealt, pending, result, execute };
}

export type TradeTicketState = ReturnType<typeof useTradeTicket>;
