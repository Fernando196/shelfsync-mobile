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

/** Coincidencias parciales por SKU o por codigo de barras (sin importar mayusculas).
 * La API combina filtros con AND, asi que son dos busquedas y se juntan sin repetir. */
export async function searchProductsByCode(term: string): Promise<IProductLookup[]> {
  const q = encodeURIComponent(term);
  const [bySku, byBarcode]: IProductLookup[][] = await Promise.all([
    request(`/product-lookup?filters[sku][like]=${q}&page=1&limit=10`),
    request(`/product-lookup?filters[barcode][like]=${q}&page=1&limit=10`),
  ]);
  const seen = new Set<string>();
  return [...bySku, ...byBarcode].filter((p) => !seen.has(p.id) && !!seen.add(p.id)).slice(0, 10);
}

export function searchProducts(term: string): Promise<IProductLookup[]> {
  return request(`/product-lookup?filters[description][like]=${encodeURIComponent(term)}&limit=10`);
}
