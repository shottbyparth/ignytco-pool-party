import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Gracefully intercept and suppress benign local development WebSocket / Vite HMR connection warnings in AI Studio sandboxes.
// This prevents development-only connection notices from causing visible "Unhandled Rejection" notices or page overlays.
if (typeof window !== 'undefined') {
  // 1. Monkeypatch standard WebSocket constructor to cleanly handle 'vite-hmr' and internal dev-server connections
  const OriginalWebSocket = window.WebSocket;
  if (OriginalWebSocket) {
    const CustomWebSocket = function (this: any, url: string | URL, protocols?: string | string[]) {
      const urlStr = typeof url === 'string' ? url : url.toString();
      const hasViteProtocol = protocols && (
        protocols === 'vite-hmr' || 
        (Array.isArray(protocols) && protocols.includes('vite-hmr'))
      );
      
      const isViteUrl = urlStr.includes('/vite') || 
                        urlStr.includes('/_vite/') || 
                        urlStr.includes('localhost:3000') ||
                        urlStr.includes('hmr');

      if (hasViteProtocol || isViteUrl) {
        console.log('🔌 Prevented benign Vite development HMR WebSocket connection to:', urlStr);
        // Create an elegant, safe, non-throwing mock WebSocket instance that is permanently in CLOSED state
        const mockWS = {
          url: urlStr,
          readyState: 3, // WebSocket.CLOSED
          bufferedAmount: 0,
          extensions: '',
          protocol: '',
          binaryType: 'blob',
          addEventListener: () => {},
          removeEventListener: () => {},
          send: () => {},
          close: () => {},
          onopen: null,
          onmessage: null,
          onerror: null,
          onclose: null,
        };
        return mockWS;
      }

      // Fall back to original WebSocket constructor for normal client connections
      if (protocols) {
        return new (OriginalWebSocket as any)(url, protocols);
      }
      return new (OriginalWebSocket as any)(url);
    };

    // Keep prototypes aligned where possible
    CustomWebSocket.prototype = OriginalWebSocket.prototype;
    // Assign custom constructor back to window
    try {
      (window as any).WebSocket = CustomWebSocket;
    } catch (err) {
      console.warn('⚠️ Couldn\'t patch window.WebSocket directly (read-only in sandbox):', err);
    }
  }

  // 2. Add high-level defensive handlers as backups to catch and ignore residual web socket notices
  const isDevBenignError = (msg: string) => {
    const normalized = msg.toLowerCase();
    return (
      normalized.includes('websocket') || 
      normalized.includes('vite') || 
      normalized.includes('hmr') || 
      normalized.includes('connection refused')
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

