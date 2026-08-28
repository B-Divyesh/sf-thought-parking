export type ThoughtStatus = 'parked' | 'archived' | 'promoted';

export interface Thought {
  id: string;
  text: string;
  createdAt: number;
  updatedAt: number;
  captureMs: number;
  status: ThoughtStatus;
  decidedAt?: number;
  audio?: Blob;
  audioMime?: string;
}

export interface PortableThought extends Omit<Thought, 'audio'> {
  audio?: string;
}

export interface ParkingExport {
  product: 'thought-parking';
  version: 1;
  exportedAt: string;
  thoughts: PortableThought[];
}
