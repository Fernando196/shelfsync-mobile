import { toUploadPart } from '../lib/uploadPart';
import { IInventoryItem } from '../interfaces/item.interface';
import { API_BASE_URL, request } from '../api/http';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

// Pensado para Marketplace: 2048px es lo maximo que muestra Facebook, asi casi no la
// reescala ni la vuelve a degradar. La foto llega sin comprimir (quality 1 al tomarla o
// elegirla) y aqui se comprime una sola vez.
const MAX_PHOTO_SIDE = 2048;
const PHOTO_QUALITY = 0.85;

export async function uploadPhoto(id: string, fileUri: string): Promise<IInventoryItem> {
  const form = new FormData();
  const original = await ImageManipulator.manipulate(fileUri).renderAsync();
  const context = ImageManipulator.manipulate(fileUri);
  // Limita el lado mas largo (vertical u horizontal); si ya es chica no se agranda.
  if (Math.max(original.width, original.height) > MAX_PHOTO_SIDE) {
    context.resize(
      original.width >= original.height ? { width: MAX_PHOTO_SIDE } : { height: MAX_PHOTO_SIDE },
    );
  }
  const image = await context.renderAsync();
  const result = await image.saveAsync({ compress: PHOTO_QUALITY, format: SaveFormat.JPEG });
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
