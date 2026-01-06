'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface DashboardRefreshContextType {
  refreshDashboard: () => void;
  lastRefresh: number;
}

const DashboardRefreshContext = createContext<DashboardRefreshContextType | undefined>(undefined);

const REFRESH_KEY = 'dashboard_refresh_timestamp';

export function DashboardRefreshProvider({ children }: { children: ReactNode }) {
  const [lastRefresh, setLastRefresh] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(REFRESH_KEY);
      return stored ? parseInt(stored, 10) : Date.now();
    }
    return Date.now();
  });

  const refreshDashboard = () => {
    const now = Date.now();
    localStorage.setItem(REFRESH_KEY, now.toString());
    setLastRefresh(now);
  };

  // Listen for storage changes (for cross-tab updates)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === REFRESH_KEY && e.newValue) {
        setLastRefresh(parseInt(e.newValue, 10));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <DashboardRefreshContext.Provider value={{ refreshDashboard, lastRefresh }}>
      {children}
    </DashboardRefreshContext.Provider>
  );
}

export function useDashboardRefresh() {
  const context = useContext(DashboardRefreshContext);
  if (context === undefined) {
    throw new Error('useDashboardRefresh must be used within a DashboardRefreshProvider');
  }
  return context;
}