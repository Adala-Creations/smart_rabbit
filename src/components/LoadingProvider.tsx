"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

type LoadingContextType = {
  isLoading: boolean;
  start: () => void;
  stop: () => void;
};

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider = ({ children }: { children: React.ReactNode }) => {
  const [count, setCount] = useState(0);

  const start = useCallback(() => setCount((c) => c + 1), []);
  const stop = useCallback(() => setCount((c) => Math.max(0, c - 1)), []);

  const value = { isLoading: count > 0, start, stop };

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {value.isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
          <div className="space-y-2 z-50 pointer-events-auto">
            <div className="mx-auto w-12 h-12 rounded-full border-4 border-t-transparent border-white animate-spin" />
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
};

export const useLoading = (): LoadingContextType => {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error('useLoading must be used within LoadingProvider');
  return ctx;
};

export default LoadingProvider;
