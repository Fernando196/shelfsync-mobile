import { ICategoryItem } from './category.interface';
import { EnumItemStatus } from './enum/itemStatus.type';
import { IAuditable } from './generic.interface';
import { ICreateProductLookupInput, IProductLookup } from './productLookup.interface';

export interface IInventoryPhoto {
  id: string;
  filename: string;
  url: string;
  createdAt: string;
  // Variantes WebP de la API (240px y 800px); null si no se generaron: usar `url`.
  thumbnailUrl: string | null;
  mediumUrl: string | null;
}

export interface IInventoryItem extends IAuditable {
  id: string;
  code: number;
  categoryId: string | null;
  name: string | null;
  qty: number;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  files?: IInventoryPhoto[];
  notes: string | null;

  category?: ICategoryItem | null;
  productLookupId?: string;
  productLookup: IProductLookup;

  status: EnumItemStatus;
  cover?: IInventoryPhoto | null;
  // Portada elegida a mano; null = automatica (la foto mas reciente).
  coverPhotoId?: string | null;
  // price = precio de venta (Marketplace); cost = lo que costo de bodega (manifiesto).
  price?: number | null;
  cost?: number | null;
  condition?: ItemCondition;
}

// Mismos estados que pide Facebook Marketplace.
export type ItemCondition = 'new' | 'used_like_new' | 'used_good' | 'used_fair';
export const ITEM_CONDITIONS: ItemCondition[] = ['new', 'used_like_new', 'used_good', 'used_fair'];

export interface IItemStatusCounts {
  total: number;
  counts: Record<EnumItemStatus, number>;
}

export interface IUpsertItemInput {
  id?: string;
  categoryId?: string;
  name: string;
  qty: number;
  location: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  productLookupId?: string;
  productLookup?: ICreateProductLookupInput;
  price?: number | null;
  cost?: number | null;
  condition?: ItemCondition;
}

export interface IEditForm {
  name: string;
  qty: number;
  location: string;
  latitude: number | null;
  longitude: number | null;
  categoryId: string | null;
  // Texto tal cual se escribe; se convierte a numero al guardar.
  price: string;
  cost: string;
  condition: ItemCondition;
}

export interface IItemStatusHistory {
  id: string;
  fromStatus: EnumItemStatus | null;
  toStatus: EnumItemStatus;
  comment: string | null;
  changedAt: string;
  changedBy: { id: string; fullName: string | null } | null;
}

export interface IItemStatusHistoryResponse {
  data: IItemStatusHistory[];
  count: number;
}
