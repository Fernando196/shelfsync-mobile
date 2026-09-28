import { getAccessToken, notifyUnauthorized } from '../lib/auth';

if (!process.env.EXPO_PUBLIC_API_BASE_URL) {
  throw new Error('The public env variable does not exist.');
}
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
export const COMPLETE_API_BASE_URL = `${API_BASE_URL}/api`;

const REQUEST_TIMEOUT_MS = 12000;

export async function fetchWithTimeout(input: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      throw new Error(
        'Tiempo de espera agotado contactando al servidor. Revisa la conexion o la IP configurada.',
      );
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

export async function request(path: string, options: RequestInit = {}) {
  const token = await getAccessToken();
  const isForm = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isForm ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetchWithTimeout(`${COMPLETE_API_BASE_URL}${path}`, { ...options, headers });
  if (res.status === 401) notifyUnauthorized();
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.message || `Error ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}
