'use client';

export const OFFLINE_WARMUP_EVENTS = {
  update: 'offline-warmup-update',
};

export const OFFLINE_WARMUP_STATUS_KEY = 'smart-rabbit-offline-warmup-status-v1';

export const ROUTES_TO_WARM = [
  '/dashboard',
  '/dashboard/rabbits',
  '/dashboard/breeding',
  '/dashboard/deaths',
  '/dashboard/finances',
  '/dashboard/notes',
  '/dashboard/locations',
  '/dashboard/workers',
  '/dashboard/reports',
  '/dashboard/outbox',
  '/dashboard/profile',
];

export type WarmupStatus = {
  phase: 'idle' | 'warming' | 'ready';
  completed: number;
  total: number;
  updatedAt: number;
};

export const defaultWarmupStatus = (): WarmupStatus => ({
  phase: 'idle',
  completed: 0,
  total: ROUTES_TO_WARM.length,
  updatedAt: Date.now(),
});

export function readWarmupStatus(): WarmupStatus {
  if (typeof window === 'undefined') return defaultWarmupStatus();

  const raw = sessionStorage.getItem(OFFLINE_WARMUP_STATUS_KEY);
  if (!raw) return defaultWarmupStatus();

  try {
    const parsed = JSON.parse(raw) as Partial<WarmupStatus>;
    return {
      phase: parsed.phase === 'warming' || parsed.phase === 'ready' ? parsed.phase : 'idle',
      completed: Number(parsed.completed ?? 0),
      total: Number(parsed.total ?? ROUTES_TO_WARM.length),
      updatedAt: Number(parsed.updatedAt ?? Date.now()),
    };
  } catch {
    return defaultWarmupStatus();
  }
}

export function writeWarmupStatus(status: WarmupStatus) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(OFFLINE_WARMUP_STATUS_KEY, JSON.stringify(status));
  window.dispatchEvent(new CustomEvent(OFFLINE_WARMUP_EVENTS.update, { detail: status }));
}
