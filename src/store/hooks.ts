import { useCallback, useSyncExternalStore } from 'react';
import type { QuoteStore } from './QuoteStore';
import type { ValueStore } from './ValueStore';

export function useValue<T>(store: ValueStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.get);
}

/** Re-renders only when THIS symbol's quote changes. */
export function useQuote(store: QuoteStore, symbol: string) {
  const subscribe = useCallback((listener: () => void) => store.subscribe(symbol, listener), [store, symbol]);
  const getSnapshot = useCallback(() => store.get(symbol), [store, symbol]);
  return useSyncExternalStore(subscribe, getSnapshot);
}