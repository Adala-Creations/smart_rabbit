export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">You are offline</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Smart Rabbit will keep cached pages available. Once your connection returns, your latest data will sync.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Try reconnecting and refresh this page.</p>
      </div>
    </main>
  );
}
