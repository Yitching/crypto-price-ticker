/** One observable value. React reads it through useValue(). */
export class ValueStore<T> {
  private value: T;
  private readonly listeners = new Set<() => void>();

  constructor(initial: T) {
    this.value = initial;
  }

  readonly get = (): T => this.value;

  set(next: T | ((previous: T) => T)): void {
    this.value = typeof next === 'function' ? (next as (previous: T) => T)(this.value) : next;
    this.listeners.forEach((listener) => listener());
  }

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
}