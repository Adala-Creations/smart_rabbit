"use client";

import { useCallback } from 'react';
import { useLoading } from '@/components/LoadingProvider';

export const useFetchWithLoading = () => {
  const { start, stop } = useLoading();
  return useCallback(async (input: RequestInfo, init?: RequestInit) => {
    start();
    try {
      const res = await fetch(input, init);
      return res;
    } finally {
      stop();
    }
  }, [start, stop]);
};

export default useFetchWithLoading;
