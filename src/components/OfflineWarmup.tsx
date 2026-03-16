'use client';

import { useEffect } from 'react';
import {
  ROUTES_TO_WARM,
  defaultWarmupStatus,
  readWarmupStatus,
  writeWarmupStatus,
} from '@/lib/offlineWarmupStatus';

function schedule(task: () => void) {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(task, { timeout: 4000 });
    return;
  }
  setTimeout(task, 1200);
}

export default function OfflineWarmup() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!navigator.onLine) return;

    const previous = readWarmupStatus();
    if (previous.phase === 'ready') return;

    const base = defaultWarmupStatus();
    writeWarmupStatus({ ...base, phase: 'warming', completed: 0 });

    schedule(async () => {
      let completed = 0;

      try {
        for (const route of ROUTES_TO_WARM) {
          await fetch(route, {
              method: 'GET',
              credentials: 'include',
              cache: 'no-cache',
              headers: {
                'X-Offline-Warmup': '1',
              },
            }).catch(() => null);

          completed += 1;
          writeWarmupStatus({
            phase: 'warming',
            completed,
            total: ROUTES_TO_WARM.length,
            updatedAt: Date.now(),
          });
        }
      } finally {
        writeWarmupStatus({
          phase: 'ready',
          completed: ROUTES_TO_WARM.length,
          total: ROUTES_TO_WARM.length,
          updatedAt: Date.now(),
        });
      }
    });
  }, []);

  return null;
}
