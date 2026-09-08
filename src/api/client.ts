import { getAccessToken, notifyUnauthorized } from "../lib/auth";

// Cambia esto por la IP local de la maquina donde corre el backend - el
// celular no es la misma maquina que tu PC, "localhost" ahi apuntaria al
// propio telefono. Ejemplo: "http://192.168.1.79:4000"
export const API_BASE_URL = "http://192.168.1.79:4000";

// fetch en React Native no tiene timeout por defecto: si el telefono no
// alcanza al backend (IP equivocada, otra red WiFi, firewall) la promesa se
// queda colgada en vez de rechazar, y en la cola offline eso se ve como un
// producto atorado en "Sincronizando..." para siempre, sin ningun error.
// Con esto, a los REQUEST_TIMEOUT_MS se cancela y se convierte en un error
// normal que la cola si puede mostrar y reintentar.
const REQUEST_TIMEOUT_MS = 12000;

async function fetchWithTimeout(input: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (e: any) {
    if (e?.name === "AbortError") {
      throw new Error("Tiempo de espera agotado contactando al servidor. Revisa la conexion o la IP configurada.");
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

export interface InventoryPhoto {
  id: string;
  filename: string;
  url: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  qty: number;
  location: string;
  category: string;
  latitude: number | null;
  longitude: number | null;
  photos: InventoryPhoto[];
  createdAt: string;
  updatedAt: string;
}

export interface UpsertItemInput {
  id?: string;
  sku: string;
  name: string;
  qty: number;
  location: string;
  category: string;
  latitude?: number;
  longitude?: number;
}

export interface LoginResponse {
  accessToken: string;
  user: { id: string; email: string; name?: string; role?: string };
}

/** Login unico por dispositivo (ver src/lib/auth.ts): el token que devuelve
 * se guarda y se reusa en cada request hasta que el operario cierra sesion. */
export function login(email: string, password: string): Promise<LoginResponse> {
  return request("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

async function request(path: string, options: RequestInit = {}) {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetchWithTimeout(`${API_BASE_URL}${path}`, { ...options, headers });
  if (res.status === 401) notifyUnauthorized();
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.message || `Error ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

/** Crea o actualiza (upsert idempotente) un articulo. Si `input.id` viene de
 * la cola offline, reenviar el mismo POST no genera duplicados. */
export function createItem(input: UpsertItemInput): Promise<InventoryItem> {
  return request("/api/items", { method: "POST", body: JSON.stringify(input) });
}

export function updateItem(id: string, patch: Partial<UpsertItemInput>): Promise<InventoryItem> {
  return request(`/api/items/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(patch) });
}

/** Soft-delete: el articulo deja de aparecer en listItems pero no se borra fisicamente. */
export function deleteItem(id: string): Promise<null> {
  return request(`/api/items/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function getItemById(id: string): Promise<InventoryItem> {
  return request(`/api/items/${encodeURIComponent(id)}`);
}

/** Se mantiene por el flujo de escaneo QR: la etiqueta impresa codifica el SKU, no el id. */
export function getItemBySku(sku: string): Promise<InventoryItem> {
  return request(`/api/items/sku/${encodeURIComponent(sku)}`);
}

export function listItems(query?: string): Promise<InventoryItem[]> {
  const qs = query ? `?q=${encodeURIComponent(query)}` : "";
  return request(`/api/items${qs}`);
}

export async function uploadPhoto(id: string, fileUri: string): Promise<InventoryItem> {
  const form = new FormData();
  // @ts-expect-error - forma que espera React Native para adjuntar un archivo local
  form.append("photos", { uri: fileUri, name: `foto-${Date.now()}.jpg`, type: "image/jpeg" });

  const token = await getAccessToken();
  const headers: Record<string, string> = { "Content-Type": "multipart/form-data" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetchWithTimeout(`${API_BASE_URL}/api/items/${encodeURIComponent(id)}/photos`, {
    method: "POST",
    body: form,
    headers,
  });
  if (res.status === 401) notifyUnauthorized();
  if (!res.ok) throw new Error(`Error subiendo foto: ${res.status}`);
  const data = await res.json();
  return data.item as InventoryItem;
}

export function photoUrl(relativeUrl: string): string {
  return `${API_BASE_URL}${relativeUrl}`;
}
