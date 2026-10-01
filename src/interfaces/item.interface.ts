import { ICategoryItem } from './category.interface';
import { IAuditable } from './generic.interface';
import { CreateProductLookupInput, IProductLookup } from './productLookup.interface';

export interface InventoryPhoto {
  id: string;
  filename: string;
  url: string;
  createdAt: string;
}

export interface InventoryItem extends IAuditable {
  id: string;
  code: number;
  categoryId: string | null;
  name: string | null;
  qty: number;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  files?: InventoryPhoto[];
  notes: string | null;

  category?: ICategoryItem | null;
  productLookupId?: string;
  productLookup: IProductLookup;
}

export interface UpsertItemInput {
  id?: string;
  categoryId?: string;
  name: string;
  qty: number;
  location: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  productLookupId?: string;
  productLookup?: CreateProductLookupInput;
}

export interface EditForm {
  name: string;
  qty: number;
  location: string;
  latitude: number | null;
  longitude: number | null;
  categoryId: string | null;
}
