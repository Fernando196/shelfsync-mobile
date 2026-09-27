import * as SecureStore from 'expo-secure-store';
import { readJSON, writeJSON, removeKey, STORAGE_KEYS } from './storage';

// El PIN y el token del backend se guardan en SecureStore (Keychain/Keystore,
// cifrado a nivel de OS). El perfil local (nombre/rol, no sensible) se guarda
// en AsyncStorage junto con la cola de sincronizacion.
const PIN_SECURE_KEY = 'mp210_operator_pin';
const TOKEN_SECURE_KEY = 'mp210_access_token';

// El perfil ya no se captura a mano: viene del `user` que devuelve el login
// del backend (no tiene rol, solo id/email/fullName - modelo de un solo rol).
export interface OperatorProfile {
  userId: string;
  email: string;
  fullName: string | null;
  createdAt: string;
}

// --- Token de backend: login unico por dispositivo, se reusa hasta que el
// operario cierre sesion explicitamente desde Ajustes. ---

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_SECURE_KEY);
}

export async function hasAccessToken(): Promise<boolean> {
  return (await getAccessToken()) !== null;
}

export async function saveAccessToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_SECURE_KEY, token);
}

// --- Perfil local + PIN: se piden una sola vez despues del login, y desde
// entonces desbloquean la app sin volver a hablar con el backend. ---

export async function getProfile(): Promise<OperatorProfile | null> {
  return readJSON<OperatorProfile>(STORAGE_KEYS.profile);
}

export async function hasProfile(): Promise<boolean> {
  return (await getProfile()) !== null;
}

/** Se llama justo despues de un login exitoso: guarda el `user` del backend
 * como perfil local (una sola fuente de verdad, sin duplicar nombre/rol). */
export async function saveProfileFromUser(user: {
  id: string;
  email: string;
  fullName?: string | null;
}): Promise<OperatorProfile> {
  const profile: OperatorProfile = {
    userId: user.id,
    email: user.email,
    fullName: user.fullName ?? null,
    createdAt: new Date().toISOString(),
  };
  await writeJSON(STORAGE_KEYS.profile, profile);
  return profile;
}

export async function hasPin(): Promise<boolean> {
  return (await SecureStore.getItemAsync(PIN_SECURE_KEY)) !== null;
}

export async function setPin(pin: string): Promise<void> {
  await SecureStore.setItemAsync(PIN_SECURE_KEY, pin);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const saved = await SecureStore.getItemAsync(PIN_SECURE_KEY);
  return saved !== null && saved === pin;
}

/** Borra token, PIN y perfil local (cierre de sesion completo: login,
 * registro local y PIN se vuelven a pedir). No toca el inventario ya
 * sincronizado en el backend. */
export async function resetSession(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_SECURE_KEY);
  await SecureStore.deleteItemAsync(TOKEN_SECURE_KEY);
  await removeKey(STORAGE_KEYS.profile);
}

// api/http.ts avisa aqui cuando el backend responde 401 (token invalido o
// vencido) para que la app borre el token y vuelva a LoginScreen sin que
// cada pantalla tenga que manejarlo por separado.
let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(fn: (() => void) | null): void {
  unauthorizedHandler = fn;
}

export function notifyUnauthorized(): void {
  unauthorizedHandler?.();
}
