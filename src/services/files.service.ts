import { toUploadPart } from '../lib/uploadPart';
import { IInventoryItem } from '../interfaces/item.interface';
import { API_BASE_URL, request } from '../api/http';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export async function uploadPhoto(id: string, fileUri: string): Promise<IInventoryItem> {
  const form = new FormData();
  const context = ImageManipulator.manipulate(fileUri);
  context.resize({ width: 1280 });
  const image = await context.renderAsync();
  const result = await image.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
  // El Content-Type con boundary lo pone fetch solo.
  form.append('photos', await toUploadPart(result.uri), `foto-${Date.now()}.jpg`);

  const response = <IInventoryItem>await request(`/items/${encodeURIComponent(id)}/photos`, {
    method: 'POST',
    body: form,
  });
  return response;
}

export function photoUrl(relativeUrl: string): string {
  return `${API_BASE_URL}${relativeUrl}`;
}
