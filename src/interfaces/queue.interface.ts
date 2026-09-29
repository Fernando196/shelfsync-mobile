export interface QueuedProduct {
  localId: string;
  code: string;
  categoryId?: string;
  sku: string;
  name: string;
  qty: number;
  location: string;
  photoUris: string[];
  latitude?: number;
  longitude?: number;
}

export type QueueStatus = 'pending' | 'syncing' | 'synced' | 'error';

export interface QueueEntry {
  localId: string;
  product: QueuedProduct;
  status: QueueStatus;
  error?: string;
  createdAt: string;
  updatedAt: string;
}
