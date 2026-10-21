import { request } from '../api/http';
import { EnumItemStatus } from '../interfaces/enum/itemStatus.type';
import { IPaginated } from '../interfaces/generic.interface';
import {
  IInventoryItem,
  IUpsertItemInput,
  IItemStatusHistoryResponse,
  IItemStatusCounts,
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

export function listItems(
  query?: string,
  offset: number = 0,
  limit: number = 20,
  status?: EnumItemStatus | null,
): Promise<IPaginated<IInventoryItem[]>> {
  const params = new URLSearchParams({ offset: String(offset), limit: String(limit) });
  if (query) params.set('q', query);
  if (status) params.set('status', status);
  return request(`/items?${params}`);
}

/** Cuantos items hay por estatus (respeta la busqueda, no el filtro de estatus). */
export function getStatusCounts(query?: string): Promise<IItemStatusCounts> {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  return request(`/items/status-counts?${params}`);
}

export function getStatusHistory(id: string): Promise<IItemStatusHistoryResponse> {
  return request(`/items/${encodeURIComponent(id)}/history`);
}
