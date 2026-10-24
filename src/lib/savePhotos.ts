import { Alert } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import i18n from '../i18n';

// Guarda las fotos originales en la galeria para subirlas a Marketplace. Se bajan al
// abrir la hoja (cache) para que el boton de guardar sea inmediato.
export type PreparedPhotos = File[];
export const canSavePhotos = true;

export async function preparePhotos(urls: string[]): Promise<PreparedPhotos> {
  const dir = new Directory(Paths.cache, 'marketplace');
  dir.create({ idempotent: true });
  return Promise.all(urls.map((url) => File.downloadFileAsync(url, dir, { idempotent: true })));
}

export async function savePhotos(photos: PreparedPhotos): Promise<void> {
  const { granted } = await MediaLibrary.requestPermissionsAsync(true, ['photo']);
  if (!granted) throw new Error(i18n.t('marketplace.photosPermission'));
  for (const photo of photos) {
    await MediaLibrary.Asset.create(photo.uri);
  }
  Alert.alert(i18n.t('marketplace.title'), i18n.t('marketplace.photosSaved', { count: photos.length }));
}
