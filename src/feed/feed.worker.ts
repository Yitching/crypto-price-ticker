import { FeedEngine } from './FeedEngine';
import type { FeedCommand, FeedEvent } from './protocol';

// Inside a worker, `self` is the worker's global scope. Typed narrowly so we don't need the WebWorker lib.
const scope = self as unknown as {
  postMessage(event: FeedEvent): void;
  onmessage: ((event: MessageEvent<FeedCommand>) => void) | null;
};

const post = (event: FeedEvent) => scope.postMessage(event);

const engine = new FeedEngine({
  quotes: (quotes) => post({ type: 'quotes', quotes }),
  status: (provider, state, detail) => post({ type: 'status', provider, state, detail }),
  stats: (stats) => post({ type: 'stats', stats }),
});

scope.onmessage = ({ data }) => {
  switch (data.type) {
    case 'start':
      engine.start(data.config);
      break;
    case 'stop':
      engine.stop();
      break;
  }
};