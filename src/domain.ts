import type { ParkingExport, PortableThought, Thought } from './types';

export const MAX_THOUGHT_LENGTH = 4000;

export function makeThought(text: string, captureMs: number, audio?: Blob): Thought {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    text: text.trim(),
    createdAt: now,
    updatedAt: now,
    captureMs: Math.max(0, Math.round(captureMs)),
    status: 'parked',
    ...(audio ? { audio, audioMime: audio.type || 'audio/webm' } : {}),
  };
}

export function formatParkedTime(timestamp: number, now = Date.now()): string {
  const delta = Math.max(0, now - timestamp);
  if (delta < 60_000) return 'just now';
  if (delta < 3_600_000) return `${Math.floor(delta / 60_000)} min ago`;
  if (delta < 86_400_000) return `${Math.floor(delta / 3_600_000)} hr ago`;
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(timestamp);
}

export function twoWeekStats(thoughts: Thought[], now = Date.now()) {
  const cutoff = now - 14 * 86_400_000;
  const recent = thoughts.filter((thought) => thought.createdAt >= cutoff);
  const fast = recent.filter((thought) => thought.captureMs <= 30_000).length;
  return {
    count: recent.length,
    fast,
    percentage: recent.length ? Math.round((fast / recent.length) * 100) : 0,
  };
}

export function isPortableThought(value: unknown): value is PortableThought {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === 'string'
    && typeof item.text === 'string'
    && item.text.length <= MAX_THOUGHT_LENGTH
    && typeof item.createdAt === 'number'
    && typeof item.updatedAt === 'number'
    && typeof item.captureMs === 'number'
    && ['parked', 'archived', 'promoted'].includes(String(item.status))
    && (item.audio === undefined || (typeof item.audio === 'string' && item.audio.startsWith('data:audio/')));
}

export function parseParkingExport(raw: string): ParkingExport {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object') throw new Error('That file does not contain a Thought Parking backup.');
  const record = parsed as Record<string, unknown>;
  if (record.product !== 'thought-parking' || record.version !== 1 || !Array.isArray(record.thoughts)) {
    throw new Error('Choose a Thought Parking JSON export (version 1).');
  }
  if (!record.thoughts.every(isPortableThought)) throw new Error('One or more thoughts in that file are damaged or unsupported.');
  return parsed as ParkingExport;
}
