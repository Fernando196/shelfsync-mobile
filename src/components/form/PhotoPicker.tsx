import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Image, Pressable, ScrollView, Alert, Platform } from 'react-native';
import { Camera, ImagePlus, X } from 'lucide-react-native';
import { hapticTap, hapticSelect } from '../../lib/haptics';
import { pickFromLibrary } from '../../lib/pickFromLibrary';
import * as ImagePicker from 'expo-image-picker';
import { CameraCaptureModal } from '../camera/CameraCaptureModal';
import { COLORS } from '../../const/theme.const';

const TILE =
  'w-24 h-24 rounded-xl bg-primary-50 dark:bg-slate-800 border border-dashed border-primary-200 dark:border-slate-600 items-center justify-center mr-3 active:scale-95';

interface PhotoPickerProps {
  photos: string[];
  onChange: (photos: string[]) => void;
}

export default function PhotoPicker({ photos, onChange }: PhotoPickerProps) {
  const { t } = useTranslation();
  const [cameraOpen, setCameraOpen] = useState(false);

  const addFromLibrary = async () => {
    const uris = await pickFromLibrary();
    if (uris.length) onChange([...photos, ...uris]);
  };

  const openPicker = () => {
    hapticTap();
    Alert.alert(t('photoPicker.addTitle'), t('photoPicker.addMessage'), [
      { text: t('photoPicker.takePhoto'), onPress: () => setCameraOpen(true) },
      { text: t('photos.chooseFromGallery'), onPress: addFromLibrary },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  // En web, launchCameraAsync abre la camara del telefono desde el navegador.
  const addFromBrowserCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (!result.canceled && result.assets?.length) {
      onChange([...photos, ...result.assets.map((a) => a.uri)]);
    }
  };

  const removeAt = (uri: string) => {
    hapticSelect();
    onChange(photos.filter((p) => p !== uri));
  };

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {Platform.OS === 'web' ? (
          // En web no hay menu nativo y iOS abre directo la fototeca: dos botones separados.
          <>
            <Pressable onPress={addFromBrowserCamera} className={TILE}>
              <Camera size={22} color={COLORS.primary} />
            </Pressable>
            <Pressable onPress={addFromLibrary} className={TILE}>
              <ImagePlus size={22} color={COLORS.primary} />
            </Pressable>
          </>
        ) : (
          <Pressable onPress={openPicker} className={TILE}>
            <View className="items-center">
              <Camera size={22} color={COLORS.primary} />
              <ImagePlus size={14} color={COLORS.primary} style={{ marginTop: 2 }} />
            </View>
          </Pressable>
        )}

        {photos.map((uri) => (
          <View key={uri} className="mr-3">
            <Image source={{ uri }} className="w-24 h-24 rounded-xl" />
            <Pressable
              onPress={() => removeAt(uri)}
              className="absolute -top-2 -right-2 bg-rose-500 rounded-full w-6 h-6 items-center justify-center active:scale-95"
            >
              <X size={14} color="#fff" />
            </Pressable>
          </View>
        ))}
      </ScrollView>
      <CameraCaptureModal
        visible={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onDone={(uris) => {
          setCameraOpen(false);
          onChange([...photos, ...uris]);
        }}
      />
    </>
  );
}
