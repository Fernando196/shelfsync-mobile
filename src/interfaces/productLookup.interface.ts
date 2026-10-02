import { IAuditable } from './generic.interface';

export interface IProductLookup extends IAuditable {
  id: string;
  barcode: string | null;
  sku: string | null;
  description: string | null;
  needAssembly: boolean;
}

export interface CreateProductLookupInput {
  barcode?: string;
  sku?: string;
  description?: string;
  needAssembly?: boolean;
}
