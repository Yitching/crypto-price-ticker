import { useEffect, useState } from 'react';
import { useServices } from '../../app/services';
import { useValue } from '../../store/hooks';

/** Live proof of the pipeline: network rate in, screen work out. */
export function PerfStats() {
  const { quotes, stats, config, feed } = useServices();
  const feedStats = useValue(stats);
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
      setUi({ fps: frames, updates: quotes.appliedCount - lastApplied, flushes: quotes.flushCount - lastFlushes });
      frames = 0;
      lastApplied = quotes.appliedCount;
      lastFlushes = quotes.flushCount;
    }, 1000);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(timer);
    };
  }, [quotes]);

  const n = (v: number) => v.toLocaleString('en-US');

  return (
    <dl className="perf" aria-label="Performance">
      <div title="Raw price updates received from providers">
        <dt>Network</dt>
        <dd>{n(feedStats?.ticksPerSecond ?? 0)}/s</dd>
      </div>
      <div title="Symbol updates applied after conflation">
        <dt>Rendered</dt>
        <dd>{n(ui.updates)}/s</dd>
      </div>
      <div title="Times the store pushed changes to React">
        <dt>Store flushes</dt>
        <dd>{n(ui.flushes)}/s</dd>
      </div>
      <div>
        <dt>Frame rate</dt>
        <dd>{ui.fps} fps</dd>
      </div>
      <div title="Where sockets, parsing and aggregation run">
        <dt>Feed</dt>
        <dd>
          {feed.runsIn === 'worker' ? 'Worker' : 'Main thread'}
          {config.conflate ? '' : ', no conflation'}
        </dd>
      </div>
    </dl>
  );
}
