'use client';

import { enqueueMutation } from '@/lib/offlineMutationQueue';

type OfflineMutationOptions = {
  description?: string;
};

const OFFLINE_MUTATION_EVENT = 'offline-mutation-queued';

function getMethod(init?: RequestInit): string {
  return (init?.method || 'GET').toUpperCase();
}

function toUrl(input: RequestInfo): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function shouldQueue(url: string, method: string): boolean {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return false;

  // Worker creation returns a one-time password — must not be queued.
  // User PUT/DELETE are safe to queue; worker assignments are DELETE-safe.
  return (
    url.startsWith('/api/notes') ||
    url.startsWith('/api/sales') ||
    url.startsWith('/api/expenses') ||
    url.startsWith('/api/debtors') ||
    url.startsWith('/api/creditors') ||
    url.startsWith('/api/deaths') ||
    url.startsWith('/api/offspring-deaths') ||
    (url.startsWith('/api/users') && ['PUT', 'DELETE'].includes(method)) ||
    (url.startsWith('/api/workers') && method === 'DELETE')
  );
}

function normalizeBody(body?: BodyInit | null): string | undefined {
  if (!body) return undefined;
  if (typeof body === 'string') return body;
  return undefined;
}

function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {};

  if (headers instanceof Headers) {
    const out: Record<string, string> = {};
    headers.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }

  return headers;
}

export async function fetchWithOfflineMutationQueue(
  input: RequestInfo,
  init?: RequestInit,
  options?: OfflineMutationOptions
): Promise<{ response: Response; queued: boolean }> {
  const method = getMethod(init);
  const url = toUrl(input);

  try {
    const response = await fetch(input, init);
    return { response, queued: false };
  } catch (error) {
    if (!shouldQueue(url, method)) throw error;

    const queued = await enqueueMutation({
      url,
      method,
      headers: normalizeHeaders(init?.headers),
      body: normalizeBody(init?.body),
      description: options?.description,
    });

    if (!queued) throw error;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(OFFLINE_MUTATION_EVENT, { detail: queued }));
    }

    const response = new Response(
      JSON.stringify({ queued: true, offline: true }),
      {
        status: 202,
        headers: {
          'Content-Type': 'application/json',
          'X-Offline-Queued': '1',
        },
      }
    );

    return { response, queued: true };
  }
}

export const OFFLINE_QUEUE_EVENTS = {
  mutationQueued: OFFLINE_MUTATION_EVENT,
  syncRequested: 'offline-sync-requested',
  syncComplete: 'offline-sync-complete',
};
