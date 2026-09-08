import AsyncStorage from "@react-native-async-storage/async-storage";

export const STORAGE_KEYS = {
  profile: "mp210:profile",
  syncQueue: "mp210:sync-queue",
  lastPrinter: "mp210:last-printer",
  labelFormat: "mp210:label-format",
} as const;

export async function readJSON<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeJSON(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function removeKey(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}
