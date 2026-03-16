'use client';

import { useEffect, useState } from 'react';
import {
  OFFLINE_WARMUP_EVENTS,
  ROUTES_TO_WARM,
  defaultWarmupStatus,
  readWarmupStatus,
  type WarmupStatus,
} from '@/lib/offlineWarmupStatus';

export default function useOfflineWarmupStatus() {
  const [status, setStatus] = useState<WarmupStatus>(defaultWarmupStatus);

  useEffect(() => {
    setStatus(readWarmupStatus());

    const onUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<WarmupStatus>;
      if (customEvent.detail) {
        setStatus(customEvent.detail);
      } else {
        setStatus(readWarmupStatus());
      }
    };

    window.addEventListener(OFFLINE_WARMUP_EVENTS.update, onUpdate);
    return () => window.removeEventListener(OFFLINE_WARMUP_EVENTS.update, onUpdate);
  }, []);

  const total = status.total || ROUTES_TO_WARM.length;
  const completed = Math.max(0, Math.min(total, status.completed || 0));
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    status,
    total,
    completed,
    percent,
    isReady: status.phase === 'ready',
    isWarming: status.phase === 'warming',
  };
}
