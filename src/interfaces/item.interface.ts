import { ICategoryItem } from './category.interface';
import { IAuditable } from './generic.interface';

export interface InventoryPhoto {
  id: string;
  filename: string;
  url: string;
  createdAt: string;
}

export interface InventoryItem extends IAuditable {
  id: string;
  categoryId: string | null;
  sku: string;
  name: string | null;
  qty: number;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  files?: InventoryPhoto[];

  category?: ICategoryItem | null;
}

export interface UpsertItemInput {
  id?: string;
  categoryId?: string;
  sku: string;
  name: string;
  qty: number;
  location: string;
  latitude?: number;
  longitude?: number;
}

export interface EditForm {
  sku: string;
  name: string;
  qty: number;
  location: string;
  latitude: number | null;
  longitude: number | null;
  categoryId: string | null;
}
