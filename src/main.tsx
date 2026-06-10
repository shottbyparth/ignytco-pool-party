import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Gracefully intercept and suppress benign local development WebSocket / Vite HMR connection warnings in AI Studio sandboxes.
// This prevents development-only connection notices from causing visible "Unhandled Rejection" notices or page overlays.
if (typeof window !== 'undefined') {
  const isDevBenignError = (msg: string) => {
    return (
      msg.includes('WebSocket') || 
      msg.includes('vite') || 
      msg.includes('connection refused')
    );
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reasonMsg = event.reason?.message || String(event.reason || '');
    if (isDevBenignError(reasonMsg)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener('error', (event) => {
    const errorMsg = event.message || '';
    if (isDevBenignError(errorMsg)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

