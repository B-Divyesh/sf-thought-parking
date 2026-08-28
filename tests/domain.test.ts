import { describe, expect, it } from 'vitest';
import { formatParkedTime, isPortableThought, parseParkingExport, twoWeekStats } from '../src/domain';
import type { Thought } from '../src/types';

const thought = (overrides: Partial<Thought> = {}): Thought => ({
  id: 'thought-1',
  text: 'Remember the good idea',
  createdAt: 1_000,
  updatedAt: 1_000,
  captureMs: 12_000,
  status: 'parked',
  ...overrides,
});

describe('thought domain', () => {
  it('formats relative parked times', () => {
    expect(formatParkedTime(10_000, 20_000)).toBe('just now');
    expect(formatParkedTime(10_000, 130_000)).toBe('2 min ago');
    expect(formatParkedTime(10_000, 7_210_000)).toBe('2 hr ago');
  });

  it('calculates the private two-week return snapshot', () => {
    const now = 2_000_000_000;
    const result = twoWeekStats([
      thought({ createdAt: now - 1_000, captureMs: 8_000 }),
      thought({ id: 'thought-2', createdAt: now - 2_000, captureMs: 45_000 }),
      thought({ id: 'old', createdAt: now - 15 * 86_400_000 }),
    ], now);
    expect(result).toEqual({ count: 2, fast: 1, percentage: 50 });
  });

  it('validates portable backups and rejects unrelated JSON', () => {
    const portable = thought();
    expect(isPortableThought(portable)).toBe(true);
    expect(parseParkingExport(JSON.stringify({
      product: 'thought-parking', version: 1, exportedAt: '2026-08-28', thoughts: [portable],
    }))).toMatchObject({ product: 'thought-parking', version: 1 });
    expect(() => parseParkingExport('{"product":"notes","version":1,"thoughts":[]}')).toThrow(/Thought Parking JSON export/);
  });
});
