export interface IQueuedProduct {
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

export type IQueueStatus = 'pending' | 'syncing' | 'synced' | 'error';

export interface IQueueEntry {
  localId: string;
  product: IQueuedProduct;
  status: IQueueStatus;
  error?: string;
  createdAt: string;
  updatedAt: string;
}
