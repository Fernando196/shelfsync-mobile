import { File } from 'expo-file-system';

// El fetch global de Expo (expo/fetch) no acepta el objeto { uri, name, type }
// de React Native ("Unsupported FormDataPart implementation"); necesita un
// File de expo-file-system, que lee los bytes del archivo local.
export async function toUploadPart(uri: string): Promise<Blob> {
  const file = new File(uri);
  if (!file.exists) throw new Error('La foto ya no existe en el telefono');
  return file as unknown as Blob;
}
