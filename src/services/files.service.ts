import { File } from 'expo-file-system';
import { IInventoryItem } from '../interfaces/item.interface';
import { API_BASE_URL, request } from '../api/http';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export async function uploadPhoto(id: string, fileUri: string): Promise<IInventoryItem> {
  const form = new FormData();
  const context = ImageManipulator.manipulate(fileUri);
  context.resize({ width: 1280 });
  const image = await context.renderAsync();
  const result = await image.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
  // El fetch global de Expo (expo/fetch) no acepta el objeto { uri, name, type }
  // de React Native ("Unsupported FormDataPart implementation"); necesita un
  // File de expo-file-system, que lee los bytes del archivo local. El
  // Content-Type con boundary lo pone fetch solo.
  const file = new File(result.uri);
  if (!file.exists) throw new Error('La foto ya no existe en el telefono');
  form.append('photos', file as unknown as Blob, `foto-${Date.now()}.jpg`);

  const response = <IInventoryItem>await request(`/items/${encodeURIComponent(id)}/photos`, {
    method: 'POST',
    body: form,
  });
  return response;
}

export function photoUrl(relativeUrl: string): string {
  return `${API_BASE_URL}${relativeUrl}`;
}
