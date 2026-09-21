import { createContext, useContext } from 'react';
import { QuoteStore } from '../store/QuoteStore';
import { ValueStore } from '../store/ValueStore';

/** Composition root: every long-lived object is created here, once. */
export function createServices() {
  return {
    quotes: new QuoteStore(),
    statuses: new ValueStore<Record<string, string>>({}),
  };
}

export type Services = ReturnType<typeof createServices>;

export const ServicesContext = createContext<Services | null>(null);

export function useServices(): Services {
  const services = useContext(ServicesContext);
  if (!services) throw new Error('useServices must be used inside ServicesContext.Provider');
  return services;
}