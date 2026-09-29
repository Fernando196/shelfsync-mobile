import { ApiError, request } from '../api/http';
import { IProductLookup } from '../interfaces/productLookup.interface';

export async function findProductByCode(code: string): Promise<IProductLookup | null> {
  try {
    return await request(`/product-lookup/code/${encodeURIComponent(code)}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

export function attachBarcode(id: string, barcode: string): Promise<IProductLookup> {
  return request(`/product-lookup/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ barcode }),
  });
}
