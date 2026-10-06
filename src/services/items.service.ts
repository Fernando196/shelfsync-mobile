import { request } from '../api/http';
import { EnumItemStatus } from '../interfaces/enum/itemStatus.type';
import {
  IInventoryItem,
  IUpsertItemInput,
  IItemStatusHistoryResponse,
} from '../interfaces/item.interface';

export function createItem(input: IUpsertItemInput): Promise<IInventoryItem> {
  return request('/items', { method: 'POST', body: JSON.stringify(input) });
}

export function updateItem(id: string, patch: Partial<IUpsertItemInput>): Promise<IInventoryItem> {
  return request(`/items/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export function updateItemStatus(
  id: string,
  status: EnumItemStatus,
  comment?: string,
): Promise<IInventoryItem> {
  return request(`/items/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      status,
      comment,
    }),
  });
}

export function deleteItem(id: string): Promise<null> {
  return request(`/items/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export function getItemById(id: string): Promise<IInventoryItem> {
  return request(`/items/${encodeURIComponent(id)}`);
}

export function listItems(query?: string): Promise<IInventoryItem[]> {
  const qs = query ? `?q=${encodeURIComponent(query)}` : '';
  return request(`/items${qs}`);
}

export function getStatusHistory(id: string): Promise<IItemStatusHistoryResponse> {
  return request(`/items/${encodeURIComponent(id)}/history`);
}
