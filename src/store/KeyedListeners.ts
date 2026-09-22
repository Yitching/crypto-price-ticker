/** Listener sets keyed by symbol, so a change notifies only that symbol's subscribers. */
export class KeyedListeners {
  private readonly byKey = new Map<string, Set<() => void>>();

  subscribe(key: string, listener: () => void): () => void {
    let set = this.byKey.get(key);
    if (!set) {
      set = new Set();
      this.byKey.set(key, set);
    }
    set.add(listener);
    return () => {
      set.delete(listener);
      if (set.size === 0) this.byKey.delete(key);
    };
  }

  notify(key: string): void {
    const set = this.byKey.get(key);
    if (set) for (const listener of set) listener();
  }
}