import { memo, useCallback, useSyncExternalStore } from 'react';
import { useServices } from '../../app/services';

interface Props {
  readonly symbol: string;
  readonly width?: number;
  readonly height?: number;
}

/** Last 60 seconds of mid prices. Updates once a second, not per tick. */
export const Sparkline = memo(function Sparkline({ symbol, width = 72, height = 22 }: Props) {
  const { history } = useServices();
  const subscribe = useCallback((listener: () => void) => history.subscribe(symbol, listener), [history, symbol]);
  const values = useSyncExternalStore(subscribe, () => history.get(symbol));

  const first = values[0];
  const last = values[values.length - 1];
  if (values.length < 2 || first === undefined || last === undefined) {
    return <svg className="spark" width={width} height={height} aria-hidden="true" />;
  }

  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const points = values
    .map((v, i) => `${(i * step).toFixed(1)},${(height - 2 - ((v - min) / range) * (height - 4)).toFixed(1)}`)
    .join(' ');

  return (
    <svg
      className="spark"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      data-trend={last > first ? 'up' : last < first ? 'down' : 'flat'}
      aria-hidden="true"
    >
      <polyline points={points} />
    </svg>
  );
});
