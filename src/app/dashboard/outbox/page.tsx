'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  type QueuedMutation,
  deleteQueuedMutation,
  flushQueuedMutations,
  getQueuedMutations,
} from '@/lib/offlineMutationQueue';
import { OFFLINE_QUEUE_EVENTS } from '@/lib/offlineMutationFetch';
import { useToast } from '@/components/ToastProvider';
import { useConfirm } from '@/components/ConfirmProvider';
import useOfflineWarmupStatus from '@/hooks/useOfflineWarmupStatus';

const methodColor: Record<string, string> = {
  POST: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  PUT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  PATCH: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

function friendlyUrl(url: string) {
  try {
    const u = new URL(url, 'http://localhost');
    return u.pathname + (u.search ? u.search : '');
  } catch {
    return url;
  }
}

export default function OutboxPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const { isReady, isWarming, completed, total, percent } = useOfflineWarmupStatus();
  const [queue, setQueue] = useState<QueuedMutation[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const refresh = useCallback(async () => {
    setQueue(await getQueuedMutations());
  }, []);

  useEffect(() => {
    refresh();

    const onQueued = () => refresh();
    const onSyncComplete = (event: Event) => {
      const customEvent = event as CustomEvent<{ succeeded?: number; failed?: number }>;
      const succeeded = customEvent.detail?.succeeded ?? 0;
      const failed = customEvent.detail?.failed ?? 0;

      refresh();

      if (succeeded > 0) {
        toast.pushToast({ message: `Synced ${succeeded} change${succeeded === 1 ? '' : 's'} successfully.`, type: 'success' });
      }
      if (failed > 0) {
        toast.pushToast({ message: `${failed} change${failed === 1 ? '' : 's'} were rejected by the server and removed.`, type: 'warning' });
      }
    };

    window.addEventListener(OFFLINE_QUEUE_EVENTS.mutationQueued, onQueued);
    window.addEventListener(OFFLINE_QUEUE_EVENTS.syncComplete, onSyncComplete);

    return () => {
      window.removeEventListener(OFFLINE_QUEUE_EVENTS.mutationQueued, onQueued);
      window.removeEventListener(OFFLINE_QUEUE_EVENTS.syncComplete, onSyncComplete);
    };
  }, [refresh, toast]);

  const handleSyncAll = async () => {
    if (!navigator.onLine) {
      toast.pushToast({ message: 'You are offline. Connect to the internet first.', type: 'error' });
      return;
    }

    setIsSyncing(true);
    try {
      const result = await flushQueuedMutations();
      await refresh();

      window.dispatchEvent(
        new CustomEvent(OFFLINE_QUEUE_EVENTS.syncComplete, { detail: result })
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDiscard = async (item: QueuedMutation) => {
    const label = item.description || `${item.method} ${friendlyUrl(item.url)}`;
    if (!(await confirm(`Discard "${label}"? This change will be permanently removed from the queue.`))) return;

    await deleteQueuedMutation(item.id);
    toast.pushToast({ message: 'Change discarded.', type: 'success' });
    refresh();
  };

  const handleDiscardAll = async () => {
    if (queue.length === 0) return;
    if (!(await confirm(`Discard all ${queue.length} queued change${queue.length === 1 ? '' : 's'}? This cannot be undone.`))) return;

    await Promise.all(queue.map((item) => deleteQueuedMutation(item.id)));
    toast.pushToast({ message: 'All queued changes discarded.', type: 'success' });
    refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Offline Outbox</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Changes made while offline are stored here and will sync automatically when your connection returns.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Offline Coverage</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {isReady
            ? 'Warmup complete. Dashboard pages are primed for offline use.'
            : isWarming
              ? `Warming pages for offline access: ${completed}/${total} (${percent}%)`
              : 'Warmup has not started yet. Keep this tab online for a few seconds.'}
        </p>

        <div className="mt-4">
          <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full bg-green-600 transition-all duration-300"
              style={{ width: `${isReady ? 100 : percent}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {isReady ? 'Ready' : `${percent}% complete`}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Queued changes
              {queue.length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                  {queue.length}
                </span>
              )}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {queue.length === 0
                ? 'No pending changes — everything is synced.'
                : `${queue.length} change${queue.length === 1 ? '' : 's'} waiting to be sent to the server.`}
            </p>
          </div>

          {queue.length > 0 && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDiscardAll}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800 dark:hover:bg-red-900/40"
              >
                Discard all
              </button>
              <button
                type="button"
                onClick={handleSyncAll}
                disabled={isSyncing}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSyncing ? 'Syncing...' : 'Sync all now'}
              </button>
            </div>
          )}
        </div>

        {queue.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-gray-500 dark:text-gray-400">Queue is empty. All changes are synced.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Endpoint</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Attempts</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Error</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {queue.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 text-xs font-mono font-semibold rounded ${methodColor[item.method] ?? 'bg-gray-100 text-gray-800'}`}>
                        {item.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {item.description ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-300 max-w-xs truncate">
                      {friendlyUrl(item.url)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">
                      {item.attempts}
                    </td>
                    <td className="px-4 py-3 text-sm text-red-600 dark:text-red-400 max-w-xs truncate">
                      {item.lastError ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDiscard(item)}
                        className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
                      >
                        Discard
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
        <strong>How it works:</strong> When you create, update, or delete records while offline, changes are saved locally in your browser. When you reconnect, they sync automatically — or you can press <em>Sync all now</em> here.
      </div>
    </div>
  );
}
