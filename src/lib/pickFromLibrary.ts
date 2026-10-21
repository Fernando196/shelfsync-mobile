import i18n from '../i18n';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export async function pickFromLibrary(): Promise<string[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert(i18n.t('reception.locationPermissionTitle'), i18n.t('errors.galleryPermission'));
    return [];
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    quality: 0.6,
    allowsMultipleSelection: true,
  });
  if (result.canceled || !result.assets?.length) return [];
  return result.assets.map((a) => a.uri);
}
