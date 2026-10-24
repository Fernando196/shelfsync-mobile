import { Alert } from 'react-native';
import i18n from '../i18n';

// En nativo guardar en la galeria necesita expo-media-library (build nuevo); por ahora
// todavia no esta disponible.
export type PreparedPhotos = unknown[];
export const canSavePhotos = false;

export async function preparePhotos(_urls: string[]): Promise<PreparedPhotos> {
  return [];
}

export async function savePhotos(_photos: PreparedPhotos): Promise<void> {
  Alert.alert(i18n.t('marketplace.title'), i18n.t('marketplace.nativeUnavailable'));
}
