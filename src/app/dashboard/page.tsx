'use client';

import { useEffect, useState } from 'react';
import useFetchWithLoading from '@/hooks/useFetchWithLoading';
import Link from 'next/link';
import { useActiveLocation } from '@/contexts/ActiveLocationContext';
import { useDashboardRefresh } from '@/contexts/DashboardRefreshContext';

interface Stats {
  totalRabbits: number;
  pendingMatings: number;
  recentBirths: number;
  totalSales: number;
  totalExpenses: number;
  totalDeaths: number;
  adultDeaths: number;
  offspringDeaths: number;
  adultHealthy: number;
  adultSick: number;
  adultInjured: number;
  offspringHealthy: number;
  offspringSick: number;
  offspringInjured: number;
}

export default function DashboardPage() {
  return (
    <DashboardContent />
  );
}

function DashboardContent() {
  const { activeLocation } = useActiveLocation();
  const { lastRefresh } = useDashboardRefresh();
  const [stats, setStats] = useState<Stats>({
    totalRabbits: 0,
    pendingMatings: 0,
    recentBirths: 0,
    totalSales: 0,
    totalExpenses: 0,
    totalDeaths: 0,
    adultDeaths: 0,
    offspringDeaths: 0,
    adultHealthy: 0,
    adultSick: 0,
    adultInjured: 0,
    offspringHealthy: 0,
    offspringSick: 0,
    offspringInjured: 0,
  });
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [apiNotifications, setApiNotifications] = useState<any[]>([]);
  const [offspring, setOffspring] = useState<any[]>([]);

  const fetchWithLoading = useFetchWithLoading();
  const getAvailableCount = (batch: any) =>
    Math.max(0, batch?.availableCount ?? batch?.count ?? 0);
  const getDisplayCount = (batch: any) => {
    const available = getAvailableCount(batch);
    const sexTotal = (batch?.maleCount ?? 0) + (batch?.femaleCount ?? 0);

    if (batch?.status === 'SEXED') {
      return Math.max(available, sexTotal);
    }

    return Math.max(available, batch?.count ?? 0);
  };

  const fetchStats = async () => {
    try {
      // Fetch rabbits
      const rabbitsRes = await fetchWithLoading('/api/rabbits');
      const rabbits = await rabbitsRes.json();
      const parentsAlive = Array.isArray(rabbits) ? rabbits.filter((r:any)=> r.status !== 'DECEASED').length : 0;

      // Fetch offspring batches (excludes ARCHIVED by default)
      const offspringRes = await fetchWithLoading('/api/offspring');
      const offspringResponse = await offspringRes.json();
      // API can return either an array of batches or a paginated { items, total, page, pageSize }
      const offspringBatches = Array.isArray(offspringResponse) ? offspringResponse : (offspringResponse?.items || []);
      // Filter out ARCHIVED batches to prevent double-counting (they're historical after sexing)
      const activeOffspringBatches = offspringBatches.filter((b: any) => b.status !== 'ARCHIVED');
      setOffspring(activeOffspringBatches);

      // Fetch matings
      const matingsRes = await fetchWithLoading('/api/matings');
      const matings = await matingsRes.json();
      const pendingMatings = matings.filter((m: any) => !m.successful).length;

      // Fetch births
      const birthsRes = await fetchWithLoading('/api/births');
      const births = await birthsRes.json();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentBirths = births.filter((b: any) => new Date(b.birthDate) >= thirtyDaysAgo).length;

      // Fetch sales
      const salesRes = await fetchWithLoading('/api/sales');
      const sales = await salesRes.json();
      const totalSales = sales.reduce((sum: number, s: any) => sum + s.amount, 0);

      // Fetch expenses
      const expensesRes = await fetchWithLoading('/api/expenses');
      const expenses = await expensesRes.json();
      const totalExpenses = expenses.reduce((sum: number, e: any) => sum + e.amount, 0);

      // Fetch deaths (parents) and offspring deaths
      const deathsRes = await fetchWithLoading('/api/deaths');
      const deaths = await deathsRes.json();
      const offspringDeathsRes = await fetchWithLoading('/api/offspring-deaths');
      const offspringDeaths = await offspringDeathsRes.json();
      const offspringDeathsTotal = Array.isArray(offspringDeaths)
        ? offspringDeaths.reduce((sum: number, d: any) => sum + (d.count || 0), 0)
        : 0;
      const totalDeaths = deaths.length + offspringDeathsTotal;

      // Only count non-ARCHIVED batches (ARCHIVED batches are historical after sexing)
      const unsexedOffspringCount = activeOffspringBatches
        .filter((b:any)=> b.status === 'ACTIVE')
        .reduce((sum: number, b: any) => sum + getAvailableCount(b), 0);
      const sexedOffspringCount = activeOffspringBatches
        .filter((b:any)=> b.status === 'SEXED')
        .reduce((sum: number, b: any) => sum + getDisplayCount(b), 0);
      const totalOffspringCount = unsexedOffspringCount + sexedOffspringCount;
      // Adult health counts (exclude deceased)
      const adultHealthy = rabbits.filter((r:any)=> r.status !== 'DECEASED' && r.healthStatus === 'HEALTHY').length;
      const adultSick = rabbits.filter((r:any)=> r.status !== 'DECEASED' && r.healthStatus === 'SICK').length;
      const adultInjured = rabbits.filter((r:any)=> r.status !== 'DECEASED' && r.healthStatus === 'INJURED').length;
      // Offspring batch health counts (only for non-ARCHIVED batches)
      const offspringHealthy = activeOffspringBatches.filter((b:any)=> b.overallHealthStatus === 'HEALTHY').length;
      const offspringSick = activeOffspringBatches.filter((b:any)=> b.overallHealthStatus === 'SICK').length;
      const offspringInjured = activeOffspringBatches.filter((b:any)=> b.overallHealthStatus === 'INJURED').length;
      setStats({
        totalRabbits: parentsAlive + totalOffspringCount,
        pendingMatings,
        recentBirths,
        totalSales,
        totalExpenses,
        totalDeaths,
        adultDeaths: deaths.length,
        offspringDeaths: offspringDeathsTotal,
        adultHealthy,
        adultSick,
        adultInjured,
        offspringHealthy,
        offspringSick,
        offspringInjured,
      });
      // Fetch notifications
      const notificationsRes = await fetchWithLoading('/api/notifications');
      const fetchedApiNotifications = await notificationsRes.json();
      setApiNotifications(fetchedApiNotifications);

      // Notifications build (combine API notifications with dynamic ones)
      const notes: string[] = [];
      
      // Add API notifications
      fetchedApiNotifications.forEach((n: any) => {
        if (!n.read) { // Only show unread notifications
          const emoji = n.type === 'MATING' ? '💕' : n.type === 'SEXING' ? '🔍' : '📢';
          notes.push(`${emoji} ${n.title}: ${n.message}`);
        }
      });

      // Dynamic notifications (health, mating readiness, sexing readiness)
      // Sick / Injured
      rabbits.filter((r: any)=> r.healthStatus === 'SICK').forEach((r:any)=>{
        notes.push(`⚠ Rabbit ${r.rabbitId} is sick${r.healthDescription?` – ${r.healthDescription}`:''}`);
      });
      rabbits.filter((r: any)=> r.healthStatus === 'INJURED').forEach((r:any)=>{
        notes.push(`🩹 Rabbit ${r.rabbitId} is injured${r.healthDescription?` – ${r.healthDescription}`:''}`);
      });
      // Does ready for mating (≥42 days since last birth, but no matings since then)
      const birthsByDoe: Record<string, any[]> = {};
      const matingsByDoe: Record<string, any[]> = {};
      births.forEach((b:any)=>{ const doeId = b.mating?.doe?.id; if (doeId){ birthsByDoe[doeId] = birthsByDoe[doeId]||[]; birthsByDoe[doeId].push(b); }});
      matings.forEach((m:any)=>{ const doeId = m.doe?.id; if (doeId){ matingsByDoe[doeId] = matingsByDoe[doeId]||[]; matingsByDoe[doeId].push(m); }});

      Object.keys(birthsByDoe).forEach(doeId => {
        const doeBirths = birthsByDoe[doeId].sort((a,b)=> new Date(b.birthDate).getTime() - new Date(a.birthDate).getTime());
        const lastBirth = doeBirths[0];

        // Find the most recent mating for this doe (any mating, not just successful)
        const doeMatings = matingsByDoe[doeId] || [];
        const lastMating = doeMatings.sort((a,b)=> new Date(b.matingDate).getTime() - new Date(a.matingDate).getTime())[0];

        // Use the most recent event (birth or any mating) to determine readiness
        let lastEventDate: Date;
        let eventType: 'birth' | 'mating';

        if (lastMating && new Date(lastMating.matingDate) > new Date(lastBirth.birthDate)) {
          lastEventDate = new Date(lastMating.matingDate);
          eventType = 'mating';
        } else {
          lastEventDate = new Date(lastBirth.birthDate);
          eventType = 'birth';
        }

        const days = (Date.now() - lastEventDate.getTime()) / (1000*60*60*24);
        const doeRabbit = rabbits.find((r:any)=> r.id === doeId);

        // Only show notification if the last event was a birth and 42+ days have passed
        // If the last event was ANY mating, don't show (she's been bred)
        if (doeRabbit && doeRabbit.status === 'ACTIVE' && eventType === 'birth' && days >= 42) {
          notes.push(`💕 Doe ${doeRabbit.rabbitId} ready for mating (last birth ${new Date(lastBirth.birthDate).toLocaleDateString()})`);
        }
      });
      // Offspring ready for sexing (≥42 days old) - only check non-ARCHIVED batches
      activeOffspringBatches.forEach((batch: any) => {
        const birthDate = new Date(batch.birth.birthDate);
        const days = (Date.now() - birthDate.getTime()) / (1000*60*60*24);
        if (batch.status === 'ACTIVE' && days >= 42) {
          notes.push(
            `🔍 Batch ${batch.batchId} ready for sexing (${getAvailableCount(batch)} kits, ${Math.floor(
              days,
            )} days old)`,
          );
        }
        if (batch.overallHealthStatus === 'SICK') {
          notes.push(`⚠ Batch ${batch.batchId} marked sick (${getAvailableCount(batch)} kits)`);
        }
        if (batch.overallHealthStatus === 'INJURED') {
          notes.push(`🩹 Batch ${batch.batchId} has injury (${getAvailableCount(batch)} kits)`);
        }
      });
      setNotifications(notes);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await fetchWithLoading('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notificationId, read: true }),
      });
      // Update local state
      setApiNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
      // Refresh notifications
      fetchStats();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  useEffect(() => {
    fetchStats();
  }, [lastRefresh]);

  if (loading) {
    return <div className="text-center py-12">Loading dashboard...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        {activeLocation ? (
          <div className="flex flex-wrap items-center gap-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-3 sm:px-4 py-2 rounded-full text-sm font-medium w-fit max-w-full">
            <span className="hidden sm:inline mr-1">📍</span>
            <span className="truncate max-w-[180px] sm:max-w-none">
              <span className="hidden sm:inline">Active: </span>
              <span className="font-semibold">{activeLocation.name}</span>
            </span>
            {/* <Link 
              href="/dashboard/locations" 
              className="whitespace-nowrap text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 text-sm"
              title="Change Location"
            >
              
            </Link> */}
          </div>
        ) : (
          <Link 
            href="/dashboard/locations" 
            className="inline-flex items-center justify-center w-full sm:w-auto px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Select Active Location
          </Link>
        )}
      </div>

      {/* Stats Grid - Fully Responsive */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg flex flex-col">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-4xl">🐰</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Rabbits
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900 dark:text-white">
                    {stats.totalRabbits}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3 mt-auto">
            <div className="text-sm">
              <Link href="/dashboard/rabbits" className="font-medium text-green-600 hover:text-green-500 dark:text-green-400">
                View all
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg flex flex-col">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-4xl">💕</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Pending Matings
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900 dark:text-white">
                    {stats.pendingMatings}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3 mt-auto">
            <div className="text-sm">
              <Link href="/dashboard/breeding" className="font-medium text-green-600 hover:text-green-500 dark:text-green-400">
                View breeding
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg flex flex-col">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-4xl">🍼</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Recent Births (30d)
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900 dark:text-white">
                    {stats.recentBirths}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3 mt-auto">
            <div className="text-sm">
              <Link href="/dashboard/breeding" className="font-medium text-green-600 hover:text-green-500 dark:text-green-400">
                View births
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg flex flex-col">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Deaths
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900 dark:text-white">
                    {stats.totalDeaths}
                  </dd>
                  <dd className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Adults: {stats.adultDeaths} • Kits: {stats.offspringDeaths}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3 mt-auto">
            <div className="text-sm">
              <Link href="/dashboard/deaths" className="font-medium text-red-600 hover:text-red-500 dark:text-red-400">
                View deaths
              </Link>
            </div>
          </div>
        </div>

        {/* Health Summary Card */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg flex flex-col">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-4xl">🩺</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Health Alerts
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900 dark:text-white">
                    {stats.adultSick + stats.adultInjured + stats.offspringSick + stats.offspringInjured}
                  </dd>
                  <dd className="mt-1 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <div>Adults – Sick: {stats.adultSick} • Injured: {stats.adultInjured}</div>
                    <div>Batches – Sick: {stats.offspringSick} • Injured: {stats.offspringInjured}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3 mt-auto">
            <div className="text-sm">
              <Link href="/dashboard/rabbits?tab=offspring" className="font-medium text-green-600 hover:text-green-500 dark:text-green-400">
                View health
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications - Mobile Optimized */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mt-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
          Notifications 
          {notifications.length > 0 && <span className="text-xs sm:text-sm font-normal text-gray-500 dark:text-gray-400">({notifications.length})</span>}
        </h2>
        {notifications.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No active alerts. Farm status is normal.</p>
        ) : (
          <ul className="space-y-2">
            {notifications.map((n,i)=> {
              // Check if this is an API notification
              const apiNotification = apiNotifications.find(an => {
                const emoji = an.type === 'MATING' ? '💕' : an.type === 'SEXING' ? '🔍' : '📢';
                return !an.read && n.startsWith(`${emoji} ${an.title}: ${an.message}`);
              });
              
              return (
                <li key={i} className={`text-sm flex items-start gap-2 p-2 rounded ${
                  apiNotification 
                    ? 'bg-blue-50 dark:bg-blue-900/20 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30' 
                    : 'bg-gray-50 dark:bg-gray-700/40'
                }`} onClick={apiNotification ? () => markNotificationAsRead(apiNotification.id) : undefined}>
                  <span>{n}</span>
                  {apiNotification && (
                    <span className="text-xs text-blue-600 dark:text-blue-400 ml-auto">Click to mark as read</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {notifications.some(n=> n.startsWith('💕')) && (
          <p className="mt-3 text-xs text-purple-600 dark:text-purple-400">Tip: Recording a new mating resets the cycle for that doe.</p>
        )}
      </div>

      {/* Financial Overview - Mobile Optimized */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mt-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
          Financial Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Sales</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${stats.totalSales.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              ${stats.totalExpenses.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Net Profit</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ${(stats.totalSales - stats.totalExpenses).toFixed(2)}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <Link
            href="/dashboard/finances"
            className="text-green-600 hover:text-green-500 dark:text-green-400 font-medium"
          >
            View detailed finances →
          </Link>
        </div>
      </div>

      {/* Quick Actions - Mobile Optimized Grid */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mt-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Link
            href="/dashboard/rabbits?action=add"
            className="flex flex-col items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <span className="text-3xl mb-2">➕</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">Add Rabbit</span>
          </Link>
          <Link
            href="/dashboard/breeding?action=record"
            className="flex flex-col items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <span className="text-3xl mb-2">💕</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">Record Mating</span>
          </Link>
          <Link
            href="/dashboard/notes?action=add"
            className="flex flex-col items-center justify-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <span className="text-3xl mb-2">📝</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">Add Note</span>
          </Link>
          <Link
            href="/dashboard/finances?action=add"
            className="flex flex-col items-center justify-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
          >
            <span className="text-3xl mb-2">💰</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">Add Transaction</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
