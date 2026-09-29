// Cola de sincronizacion offline-first: los productos se guardan localmente
// con un UUID apenas se capturan, y ese mismo UUID se manda como `id` al
// crear el articulo en el backend (POST /items es upsert idempotente por
// id), asi que reintentar un envio nunca duplica el articulo.
import { readJSON, writeJSON, STORAGE_KEYS } from './storage';
import { QueuedProduct, QueueEntry } from '../interfaces/queue.interface';
import { createItem } from '../services/items.service';
import { uploadPhoto } from '../services/files.service';

async function readQueue(): Promise<QueueEntry[]> {
  return (await readJSON<QueueEntry[]>(STORAGE_KEYS.syncQueue)) ?? [];
}

async function writeQueue(entries: QueueEntry[]): Promise<void> {
  await writeJSON(STORAGE_KEYS.syncQueue, entries);
}

export async function listQueue(): Promise<QueueEntry[]> {
  const entries = await readQueue();
  // Ordena por createdAt descendente (mas reciente primero) con comparacion
  // lexicografica simple: createdAt es un string ISO 8601, que ya ordena
  // correctamente como texto plano. Evitamos String.prototype.localeCompare
  // a proposito: en Hermes/Android sin ICU completo puede tronar con un
  // error interno tipo "Unsupported formatDataPart implementation".
  return [...entries].sort((a, b) =>
    a.createdAt > b.createdAt ? -1 : a.createdAt < b.createdAt ? 1 : 0,
  );
}

export async function enqueueProduct(product: QueuedProduct): Promise<QueueEntry> {
  const now = new Date().toISOString();
  const entry: QueueEntry = {
    localId: product.localId,
    product,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };
  const entries = await readQueue();
  entries.push(entry);
  await writeQueue(entries);
  return entry;
}

async function updateEntry(localId: string, patch: Partial<QueueEntry>): Promise<void> {
  const entries = await readQueue();
  const idx = entries.findIndex((e) => e.localId === localId);
  if (idx === -1) return;
  entries[idx] = { ...entries[idx], ...patch, updatedAt: new Date().toISOString() };
  await writeQueue(entries);
}

export async function removeEntry(localId: string): Promise<void> {
  const entries = await readQueue();
  await writeQueue(entries.filter((e) => e.localId !== localId));
}

export async function clearSynced(): Promise<void> {
  const entries = await readQueue();
  await writeQueue(entries.filter((e) => e.status !== 'synced'));
}

/** Intenta subir un solo elemento de la cola. Devuelve true si quedo sincronizado. */
export async function syncEntry(localId: string): Promise<boolean> {
  const entries = await readQueue();
  const entry = entries.find((e) => e.localId === localId);
  if (!entry) return false;

  await updateEntry(localId, { status: 'syncing', error: undefined });
  try {
    const { product } = entry;
    await createItem({
      id: product.localId,
      name: product.name,
      qty: product.qty,
      location: product.location,
      latitude: product.latitude,
      longitude: product.longitude,
      categoryId: product.categoryId,
    });
    for (const uri of product.photoUris) {
      await uploadPhoto(product.localId, uri);
    }
    await updateEntry(localId, { status: 'synced' });
    return true;
  } catch (e: any) {
    await updateEntry(localId, { status: 'error', error: e?.message ?? 'No se pudo sincronizar' });
    return false;
  }
}

export interface SyncSummary {
  attempted: number;
  synced: number;
  failed: number;
}

/** Sincroniza en orden todos los elementos pendientes o con error. */
export async function syncAll(): Promise<SyncSummary> {
  const entries = await readQueue();
  const targets = entries.filter((e) => e.status === 'pending' || e.status === 'error');
  let synced = 0;
  for (const entry of targets) {
    const ok = await syncEntry(entry.localId);
    if (ok) synced += 1;
  }
  return { attempted: targets.length, synced, failed: targets.length - synced };
}

export async function pendingCount(): Promise<number> {
  const entries = await readQueue();
  return entries.filter((e) => e.status === 'pending' || e.status === 'error').length;
}
