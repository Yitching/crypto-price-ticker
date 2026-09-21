import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { ServicesContext, createServices } from './app/services';

const params = new URLSearchParams(window.location.search);

const services = createServices({
  mode: params.get('mode') === 'stress' ? 'stress' : 'live',
  conflate: params.get('conflate') !== 'off',
  stressCount: Number(params.get('count') ?? '60'),
  stressRate: Number(params.get('rate') ?? '100'),
  useWorker: params.get('worker') !== 'off',
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ServicesContext.Provider value={services}>
      <App />
    </ServicesContext.Provider>
  </StrictMode>,
);