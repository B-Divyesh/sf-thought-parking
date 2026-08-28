import './styles.css';
import { ThoughtParkingApp } from './app';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('App root was not found.');

void new ThoughtParkingApp(root).init();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      if (registration.waiting) dispatchEvent(new Event('sw-update'));
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) dispatchEvent(new Event('sw-update'));
        });
      });
    }).catch(() => {
      // Capture still works if service worker installation is unavailable.
    });
  });
}
