import { FeedEngine, type FeedConfig, type FeedOutput } from './FeedEngine';
import { deliver, type FeedCommand, type FeedEvent } from './protocol';

/** What the app talks to. Where the engine runs is a detail behind this. */
export interface FeedClient {
  readonly runsIn: 'worker' | 'main';
  start(config: FeedConfig): void;
  stop(): void;
}

/** Engine in a Web Worker: sockets, parsing and aggregation off the main thread. */
export class WorkerFeedClient implements FeedClient {
  readonly runsIn = 'worker';
  private readonly worker: Worker;

  constructor(out: FeedOutput) {
    this.worker = new Worker(new URL('./feed.worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (event: MessageEvent<FeedEvent>) => deliver(event.data, out);
  }

  start(config: FeedConfig): void {
    this.worker.postMessage({ type: 'start', config } satisfies FeedCommand);
  }

  stop(): void {
    this.worker.postMessage({ type: 'stop' } satisfies FeedCommand);
  }
}

/** Same engine on the main thread: a fallback, and for before/after comparisons. */
export class InlineFeedClient implements FeedClient {
  readonly runsIn = 'main';
  private readonly engine: FeedEngine;

  constructor(out: FeedOutput) {
    this.engine = new FeedEngine(out);
  }

  start(config: FeedConfig): void {
    this.engine.start(config);
  }

  stop(): void {
    this.engine.stop();
  }
}

export function createFeedClient(out: FeedOutput, useWorker: boolean): FeedClient {
  if (useWorker && typeof Worker !== 'undefined') return new WorkerFeedClient(out);
  return new InlineFeedClient(out);
}