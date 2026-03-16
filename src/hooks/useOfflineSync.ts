'use client';

import { useCallback, useEffect, useState } from 'react';
import { flushQueuedMutations, getQueuedMutationCount } from '@/lib/offlineMutationQueue';
import { OFFLINE_QUEUE_EVENTS } from '@/lib/offlineMutationFetch';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [queuedCount, setQueuedCount] = useState(0);

  const refreshQueue = useCallback(async () => {
    const count = await getQueuedMutationCount();
    setQueuedCount(count);
  }, []);

  const syncNow = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;

    setIsSyncing(true);
    try {
      const result = await flushQueuedMutations();
      await refreshQueue();

      window.dispatchEvent(
        new CustomEvent(OFFLINE_QUEUE_EVENTS.syncComplete, {
          detail: result,
        })
      );
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshQueue]);

  useEffect(() => {
    refreshQueue();

    const onOnline = () => {
      setIsOnline(true);
      syncNow();
    };

    const onOffline = () => setIsOnline(false);

    const onQueued = () => refreshQueue();

    const onSyncRequested = () => {
      syncNow();
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener(OFFLINE_QUEUE_EVENTS.mutationQueued, onQueued);
    window.addEventListener(OFFLINE_QUEUE_EVENTS.syncRequested, onSyncRequested);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener(OFFLINE_QUEUE_EVENTS.mutationQueued, onQueued);
      window.removeEventListener(OFFLINE_QUEUE_EVENTS.syncRequested, onSyncRequested);
    };
  }, [refreshQueue, syncNow]);

  return {
    isOnline,
    isSyncing,
    queuedCount,
    refreshQueue,
    syncNow,
  };
}

export default useOfflineSync;
