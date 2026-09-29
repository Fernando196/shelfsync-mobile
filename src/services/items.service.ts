import { request } from '../api/http';
import { InventoryItem, UpsertItemInput } from '../interfaces/item.interface';

export function createItem(input: UpsertItemInput): Promise<InventoryItem> {
  return request('/items', { method: 'POST', body: JSON.stringify(input) });
}

export function updateItem(id: string, patch: Partial<UpsertItemInput>): Promise<InventoryItem> {
  return request(`/items/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export function deleteItem(id: string): Promise<null> {
  return request(`/items/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export function getItemById(id: string): Promise<InventoryItem> {
  return request(`/items/${encodeURIComponent(id)}`);
}

export function listItems(query?: string): Promise<InventoryItem[]> {
  const qs = query ? `?q=${encodeURIComponent(query)}` : '';
  return request(`/items${qs}`);
}
