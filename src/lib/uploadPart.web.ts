// En web la foto es un blob:/data: URL; fetch la convierte en Blob para el FormData.
export async function toUploadPart(uri: string): Promise<Blob> {
  const res = await fetch(uri);
  return res.blob();
}
