import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export async function pickFromLibrary(): Promise<string[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Permiso requerido', 'Se necesita acceso a la galeria para elegir fotos.');
    return [];
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    quality: 0.6,
    allowsMultipleSelection: true,
  });
  if (result.canceled || !result.assets?.length) return [];
  return result.assets.map((a) => a.uri);
}
