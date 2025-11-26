import { describe, it, expect } from 'vitest';
import validateSexingCounts from '@/lib/offspring';

describe('validateSexingCounts', () => {
  it('returns true when male + female equals total', () => {
    expect(validateSexingCounts(6, 3, 3)).toBe(true);
    expect(validateSexingCounts(10, 7, 3)).toBe(true);
  });

  it('returns false when male or female missing', () => {
    expect(validateSexingCounts(6, null as any, 3)).toBe(false);
    expect(validateSexingCounts(6, 3, null as any)).toBe(false);
  });

  it('returns false when negative or float values', () => {
    expect(validateSexingCounts(6, -1, 7)).toBe(false);
    expect(validateSexingCounts(6, 2.5 as any, 3)).toBe(false);
  });
});
