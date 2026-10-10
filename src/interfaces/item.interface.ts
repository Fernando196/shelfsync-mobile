import { ICategoryItem } from './category.interface';
import { EnumItemStatus } from './enum/itemStatus.type';
import { IAuditable } from './generic.interface';
import { ICreateProductLookupInput, IProductLookup } from './productLookup.interface';

export interface IInventoryPhoto {
  id: string;
  filename: string;
  url: string;
  createdAt: string;
  thumbnailUrl: string | null;
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
}

export interface IEditForm {
  name: string;
  qty: number;
  location: string;
  latitude: number | null;
  longitude: number | null;
  categoryId: string | null;
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
