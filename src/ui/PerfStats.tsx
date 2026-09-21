import { useEffect, useState } from 'react';
import { useServices } from '../app/services';
import { useValue } from '../store/hooks';

/** Network rate in, screen work out. */
export function PerfStats() {
  const { quotes, stats, config } = useServices();
  const feed = useValue(stats);
  const [ui, setUi] = useState({ fps: 0, updates: 0, flushes: 0 });

  useEffect(() => {
    let frames = 0;
    let raf = 0;
    let lastApplied = quotes.appliedCount;
    let lastFlushes = quotes.flushCount;
    const loop = () => {
      frames++;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const timer = setInterval(() => {
      setUi({
        fps: frames,
        updates: quotes.appliedCount - lastApplied,
        flushes: quotes.flushCount - lastFlushes,
      });
      frames = 0;
      lastApplied = quotes.appliedCount;
      lastFlushes = quotes.flushCount;
    }, 1000);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(timer);
    };
  }, [quotes]);

  return (
    <p>
      Conflation {config.conflate ? 'on' : 'off'} · Network {feed?.ticksPerSecond ?? 0}/s · Row updates {ui.updates}/s ·
      Screen updates {ui.flushes}/s · {ui.fps} fps
    </p>
  );
}