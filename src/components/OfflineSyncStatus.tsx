'use client';

import Link from 'next/link';
import useOfflineSync from '@/hooks/useOfflineSync';
import useOfflineWarmupStatus from '@/hooks/useOfflineWarmupStatus';

export default function OfflineSyncStatus() {
  const { isOnline, isSyncing, queuedCount, syncNow } = useOfflineSync();
  const { isReady, isWarming, completed, total, percent } = useOfflineWarmupStatus();

  if (isOnline && queuedCount === 0 && isReady) {
    return null;
  }

  return (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="font-medium">
          {isOnline
            ? (
              <div className="space-y-1">
                <div>
                  Offline queue:{' '}
                  <Link href="/dashboard/outbox" className="underline underline-offset-2 hover:opacity-80">
                    {queuedCount} pending change{queuedCount === 1 ? '' : 's'}
                  </Link>
                </div>
                {!isReady && (
                  <div className="text-xs text-amber-800/90 dark:text-amber-200/90">
                    {isWarming
                      ? `Offline page warmup: ${completed}/${total} (${percent}%)`
                      : 'Offline page warmup will start shortly...'}
                  </div>
                )}
              </div>
            )
            : 'You are offline. Changes will be queued locally.'}
        </div>
        <div className="flex gap-2">
          {queuedCount > 0 && (
            <Link
              href="/dashboard/outbox"
              className="rounded-md border border-amber-600 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 dark:text-amber-200 dark:border-amber-700 dark:hover:bg-amber-900/40"
            >
              View outbox
            </Link>
          )}
          <button
            type="button"
            disabled={!isOnline || queuedCount === 0 || isSyncing}
            onClick={syncNow}
            className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 hover:bg-amber-700"
          >
            {isSyncing ? 'Syncing...' : 'Sync now'}
          </button>
        </div>
      </div>
    </div>
  );
}
