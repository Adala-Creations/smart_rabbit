'use client';

import { useState, useEffect } from 'react';
import useFetchWithLoading from '@/hooks/useFetchWithLoading';
import Link from 'next/link';

interface HistoryStats {
  totalRabbits: number;
  totalDoes: number;
  totalBucks: number;
  totalOffspring: number;
  totalBirths: number;
  totalDeaths: number;
  totalSales: number;
  monthlyData: Array<{
    month: string;
    births: number;
    deaths: number;
    sales: number;
    offspring: number;
  }>;
}

export default function HistoryPage() {
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchWithLoading = useFetchWithLoading();

  useEffect(() => {
    fetchHistoryData();
  }, []);

  const fetchHistoryData = async () => {
    try {
      setLoading(true);

      // Fetch all data
      const [rabbitsRes, birthsRes, deathsRes, offspringDeathsRes, salesRes, offspringRes] = await Promise.all([
        fetchWithLoading('/api/rabbits'),
        fetchWithLoading('/api/births'),
        fetchWithLoading('/api/deaths'),
        fetchWithLoading('/api/offspring-deaths'),
        fetchWithLoading('/api/sales'),
        fetchWithLoading('/api/offspring')
      ]);

      const rabbits = await rabbitsRes.json();
      const births = await birthsRes.json();
      const deaths = await deathsRes.json();
      const offspringDeaths = await offspringDeathsRes.json();
      const sales = await salesRes.json();
      const offspringResponse = await offspringRes.json();
      const offspringBatches = Array.isArray(offspringResponse) ? offspringResponse : (offspringResponse?.items || []);

      // Calculate current totals
      const activeRabbits = rabbits.filter((r: any) => r.status !== 'DECEASED');
      const does = activeRabbits.filter((r: any) => r.gender === 'DOE');
      const bucks = activeRabbits.filter((r: any) => r.gender === 'BUCK');

      const totalOffspring = offspringBatches
        .filter((b: any) => b.status !== 'ARCHIVED')
        .reduce((sum: number, b: any) => {
          if (b.status === 'SEXED') {
            return sum + ((b.maleCount || 0) + (b.femaleCount || 0));
          } else {
            return sum + (b.availableCount || b.count || 0);
          }
        }, 0);

      // Calculate monthly data for the last 12 months
      const monthlyData = [];
      const now = new Date();

      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

        const monthBirths = births.filter((b: any) => {
          const birthDate = new Date(b.birthDate);
          return birthDate >= monthStart && birthDate <= monthEnd;
        }).reduce((sum: number, b: any) => sum + (b.totalKits || 0), 0);

        const monthDeaths = deaths.filter((d: any) => {
          const deathDate = new Date(d.deathDate);
          return deathDate >= monthStart && deathDate <= monthEnd;
        }).length;

        const monthOffspringDeaths = offspringDeaths.filter((d: any) => {
          const deathDate = new Date(d.deathDate);
          return deathDate >= monthStart && deathDate <= monthEnd;
        }).reduce((sum: number, d: any) => sum + (d.count || 0), 0);

        const monthSales = sales.filter((s: any) => {
          const saleDate = new Date(s.saleDate);
          return saleDate >= monthStart && saleDate <= monthEnd;
        }).length;

        // Calculate offspring count for this month (simplified - just total births minus deaths/sales)
        const monthOffspring = monthBirths - monthOffspringDeaths - monthSales;

        monthlyData.push({
          month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          births: monthBirths,
          deaths: monthDeaths + monthOffspringDeaths,
          sales: monthSales,
          offspring: Math.max(0, monthOffspring)
        });
      }

      setStats({
        totalRabbits: activeRabbits.length,
        totalDoes: does.length,
        totalBucks: bucks.length,
        totalOffspring,
        totalBirths: births.reduce((sum: number, b: any) => sum + (b.totalKits || 0), 0),
        totalDeaths: deaths.length + offspringDeaths.reduce((sum: number, d: any) => sum + (d.count || 0), 0),
        totalSales: sales.length,
        monthlyData
      });

    } catch (error) {
      console.error('Error fetching history data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading history data...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        Failed to load history data
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Rabbit History
        </h1>
      </div>
      <div>
        <Link
          href="/dashboard/reports"
          className="px-3 py-2 text-sm font-medium text-blue-600"
        >
          Back
        </Link>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-7xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl p-6">
          {/* Header */}
          <div className="flex items-center justify-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Current stats
            </h3>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">∑</span>
                  </div>
                </div>
                <div className="ml-4">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Rabbits
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stats.totalRabbits}
                  </dd>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-pink-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm">♀️</span>
                  </div>
                </div>
                <div className="ml-4">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Does
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stats.totalDoes}
                  </dd>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm">♂️</span>
                  </div>
                </div>
                <div className="ml-4">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Bucks
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stats.totalBucks}
                  </dd>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">🐰</span>
                  </div>
                </div>
                <div className="ml-4">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Offspring
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stats.totalOffspring}
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Project Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {stats.totalBirths}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total Birth Count
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">
              {stats.totalDeaths}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total Deaths
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {stats.totalSales}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total Sales
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Data Table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Monthly Activity (Last 12 Months)
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Births
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Deaths
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Sales
                </th>
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Net Offspring</th> */}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {stats.monthlyData.map((month, index) => (
                <tr
                  key={month.month}
                  className={
                    index % 2 === 0
                      ? "bg-white dark:bg-gray-800"
                      : "bg-gray-50 dark:bg-gray-900"
                  }
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {month.month}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                    {month.births}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">
                    {month.deaths}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400">
                    {month.sales}
                  </td>
                  {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 dark:text-purple-400">{month.offspring}</td> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}