import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register offline PWA service worker for Android installability & airplane-mode caching
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(<App />);
