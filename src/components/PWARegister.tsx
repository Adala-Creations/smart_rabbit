'use client';

import { useEffect } from 'react';
import { OFFLINE_QUEUE_EVENTS } from '@/lib/offlineMutationFetch';

export default function PWARegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

        if ('sync' in registration && navigator.onLine) {
          try {
            await registration.sync.register('smart-rabbit-sync');
          } catch {
            // Ignore browsers that partially implement background sync.
          }
        }
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    };

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'TRIGGER_OFFLINE_SYNC') {
        window.dispatchEvent(new Event(OFFLINE_QUEUE_EVENTS.syncRequested));
      }
    };

    navigator.serviceWorker.addEventListener('message', onMessage);
    registerSW();

    return () => {
      navigator.serviceWorker.removeEventListener('message', onMessage);
    };
  }, []);

  return null;
}
