import * as SecureStore from './secureStorage';
import { readJSON, writeJSON, removeKey, STORAGE_KEYS } from './storage';

// El token del backend se guarda en SecureStore (Keychain/Keystore, cifrado a
// nivel de OS). El perfil local (nombre/rol, no sensible) se guarda en
// AsyncStorage. El PIN se quito: la llave solo se conserva para borrar el PIN
// que quedo guardado en dispositivos de versiones anteriores.
const LEGACY_PIN_SECURE_KEY = 'mp210_operator_pin';
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

// --- Perfil local: se guarda una sola vez despues del login. ---

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

/** Borra token y perfil local (cierre de sesion completo: se vuelve a pedir
 * el login). No toca el inventario en el backend. */
export async function resetSession(): Promise<void> {
  await SecureStore.deleteItemAsync(LEGACY_PIN_SECURE_KEY);
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
