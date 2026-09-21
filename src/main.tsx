import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { ServicesContext, createServices } from './app/services';
import { SYMBOLS } from './config/symbols';
import { startFeed } from './feed/startFeed';

const services = createServices();
startFeed(SYMBOLS, services.quotes, services.statuses);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ServicesContext.Provider value={services}>
      <App />
    </ServicesContext.Provider>
  </StrictMode>,
);