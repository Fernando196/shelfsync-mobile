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

export async function deletePhoto(id: string, photoId: string): Promise<IInventoryItem> {
  return <IInventoryItem>await request(
    `/items/${encodeURIComponent(id)}/photos/${encodeURIComponent(photoId)}`,
    { method: 'DELETE' },
  );
}

/** photoId null regresa la portada a automatica (la foto mas reciente). */
export async function setCoverPhoto(id: string, photoId: string | null): Promise<IInventoryItem> {
  return <IInventoryItem>await request(`/items/${encodeURIComponent(id)}/cover`, {
    method: 'PATCH',
    body: JSON.stringify({ photoId }),
  });
}

export function photoUrl(relativeUrl: string): string {
  return `${API_BASE_URL}${relativeUrl}`;
}
