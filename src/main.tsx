// Suppress Vite HMR and WebSocket proxy errors in preview environment per instructions
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', event => {
    const reason = event?.reason?.message || String(event?.reason || '');
    if (
      reason.includes('WebSocket') ||
      reason.includes('websocket') ||
      reason.includes('closed without opened') ||
      reason.includes('[vite]')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener('error', event => {
    const msg = event?.message || '';
    if (
      msg.includes('WebSocket') ||
      msg.includes('websocket') ||
      msg.includes('closed without opened') ||
      msg.includes('[vite]')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

