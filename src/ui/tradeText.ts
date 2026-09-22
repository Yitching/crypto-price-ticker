import { providerLabel } from '../config/providers';
import type { Instrument } from '../core/types';
import type { Trade } from '../trading/types';
import { formatPrice, formatQuantity } from '../utils/priceFormat';

export function describeTrade(trade: Trade, instrument: Instrument): string {
  if (trade.status === 'rejected') return `Rejected: ${trade.rejectReason}`;
  const { request, fill } = trade;
  if (!fill) return '';
  const verb = request.side === 'buy' ? 'Bought' : 'Sold';
  return `${verb} ${formatQuantity(fill.baseAmount, instrument.sizeDecimals)} ${instrument.base} at ${formatPrice(
    fill.price,
    instrument.priceDecimals,
  )} on ${providerLabel(request.provider)}`;
}
