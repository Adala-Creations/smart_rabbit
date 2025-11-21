import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <main className="flex flex-col items-center justify-center gap-8 p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-6xl font-bold text-green-600 dark:text-green-400">
            🐰 Smart Rabbit
          </h1>
          <p className="text-2xl text-gray-700 dark:text-gray-300 max-w-2xl">
            Comprehensive Farm Management System
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl">
            Track your rabbits, manage breeding, monitor health, and analyze your farm&apos;s performance all in one place.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 justify-center mt-8">
          <Link
            href="/register"
            className="px-8 py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-lg"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 bg-white text-green-600 border-2 border-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors shadow-lg dark:bg-gray-800 dark:text-green-400 dark:border-green-400 dark:hover:bg-gray-700"
          >
            Sign In
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-5xl">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-3">📍</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Locations & Rabbitries</h3>
            <p className="text-gray-600 dark:text-gray-400">Organize your farm locations and rabbitries with multiple cages</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-3">🐇</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Rabbit Management</h3>
            <p className="text-gray-600 dark:text-gray-400">Track individual rabbits, breeding, births, and health records</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-3">💰</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Financial Tracking</h3>
            <p className="text-gray-600 dark:text-gray-400">Monitor sales, expenses, and profitability of your operation</p>
          </div>
        </div>
      </main>
    </div>
  );
}
