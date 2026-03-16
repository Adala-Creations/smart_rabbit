'use client';

import { useCallback } from 'react';
import { useLoading } from '@/components/LoadingProvider';
import { fetchWithOfflineMutationQueue } from '@/lib/offlineMutationFetch';

type MutationOptions = {
  description?: string;
};

export function useOfflineMutation() {
  const { start, stop } = useLoading();

  const mutateWithQueue = useCallback(
    async (input: RequestInfo, init?: RequestInit, options?: MutationOptions) => {
      start();
      try {
        return await fetchWithOfflineMutationQueue(input, init, options);
      } finally {
        stop();
      }
    },
    [start, stop]
  );

  return { mutateWithQueue };
}

export default useOfflineMutation;
