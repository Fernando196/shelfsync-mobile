import { useState } from 'react';
import { View, Text, Image, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Camera, ImagePlus, RotateCw } from 'lucide-react-native';
import { IInventoryItem } from '../../interfaces/item.interface';
import { photoUrl, uploadPhoto } from '../../services/files.service';
import { hapticTap, hapticSuccess, hapticError } from '../../lib/haptics';
import { pickFromLibrary } from '../../lib/pickFromLibrary';
import { CameraCaptureModal } from '../camera/CameraCaptureModal';
import { PhotoViewer } from './PhotoViewer';

interface PendingPhoto {
  uri: string;
  failed: boolean;
}

interface ItemPhotoStripProps {
  item: IInventoryItem;
  onUploaded: (item: IInventoryItem) => void;
}

const PHOTO_HEIGHT = 200;

export function ItemPhotoStrip({ item, onUploaded }: ItemPhotoStripProps) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const files = item.files ?? [];
  // Mas reciente primero, igual que en la tira.
  const photos = [...files].reverse();
  const isEmpty = files.length === 0 && pending.length === 0;

  // Sube en orden; si una falla se detiene y deja esa y las restantes marcadas para reintentar.
  const upload = async (uris: string[]) => {
    if (!uris.length) return;
    setPending((prev) => [
      ...prev.filter((p) => !uris.includes(p.uri)),
      ...uris.map((uri) => ({ uri, failed: false })),
    ]);
    for (let i = 0; i < uris.length; i++) {
      try {
        const updated = await uploadPhoto(item.id, uris[i]);
        setPending((prev) => prev.filter((p) => p.uri !== uris[i]));
        onUploaded(updated);
      } catch (e: any) {
        const failed = uris.slice(i);
        setPending((prev) =>
          prev.map((p) => (failed.includes(p.uri) ? { ...p, failed: true } : p)),
        );
        hapticError();
        Alert.alert(
          'No se pudieron subir fotos',
          `${failed.length} foto(s) sin subir. Toca la foto para reintentar.\n${e?.message ?? ''}`,
        );
        return;
      }
    }
    hapticSuccess();
  };

  const openCamera = () => {
    hapticTap();
    setCameraOpen(true);
  };

  const openLibrary = async () => {
    hapticTap();
    upload(await pickFromLibrary());
  };

  const retry = () => upload(pending.filter((p) => p.failed).map((p) => p.uri));

  return (
    <>
      {isEmpty ? (
        <View
          className="w-full bg-indigo-50 border border-dashed border-primary-200 rounded-2xl mb-4 overflow-hidden"
          style={{ height: PHOTO_HEIGHT }}
        >
          <Pressable
            onPress={openCamera}
            className="flex-1 items-center justify-center active:opacity-70"
          >
            <Camera size={32} color="#4f46e5" />
            <Text className="text-primary-600 font-semibold mt-2">Tomar fotos</Text>
          </Pressable>
          <Pressable
            onPress={openLibrary}
            className="flex-row items-center justify-center py-3 border-t border-primary-200 active:opacity-70"
          >
            <ImagePlus size={16} color="#4f46e5" />
            <Text className="text-primary-600 ml-2">Elegir de galeria</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1 mb-4">
          <View
            className="mx-1 w-28 bg-indigo-50 border border-dashed border-primary-200 rounded-2xl overflow-hidden"
            style={{ height: PHOTO_HEIGHT }}
          >
            <Pressable
              onPress={openCamera}
              className="flex-1 items-center justify-center active:opacity-70"
            >
              <Camera size={26} color="#4f46e5" />
              <Text className="text-primary-600 text-xs font-semibold mt-1">Tomar</Text>
            </Pressable>
            <Pressable
              onPress={openLibrary}
              className="items-center justify-center py-3 border-t border-primary-200 active:opacity-70"
            >
              <ImagePlus size={18} color="#4f46e5" />
              <Text className="text-primary-600 text-xs mt-1">Galeria</Text>
            </Pressable>
          </View>

          {pending.map((p) => (
            <Pressable
              key={p.uri}
              disabled={!p.failed}
              onPress={retry}
              className="mx-1"
              style={{ width: 260, height: PHOTO_HEIGHT }}
            >
              <Image source={{ uri: p.uri }} className="rounded-2xl w-full h-full" />
              <View className="absolute inset-0 rounded-2xl bg-black/40 items-center justify-center">
                {p.failed ? (
                  <>
                    <RotateCw size={24} color="#fff" />
                    <Text className="text-white text-xs font-semibold mt-1">Reintentar</Text>
                  </>
                ) : (
                  <ActivityIndicator color="#fff" />
                )}
              </View>
            </Pressable>
          ))}

          {photos.map((p, i) => (
            <Pressable key={p.id} onPress={() => setViewerIndex(i)} className="active:opacity-80">
              <Image
                source={{ uri: photoUrl(p.url) }}
                className="rounded-2xl mx-1"
                style={{ width: 260, height: PHOTO_HEIGHT }}
              />
            </Pressable>
          ))}
        </ScrollView>
      )}

      <PhotoViewer
        urls={photos.map((p) => photoUrl(p.url))}
        index={viewerIndex}
        onClose={() => setViewerIndex(null)}
      />

      <CameraCaptureModal
        visible={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onDone={(uris) => {
          setCameraOpen(false);
          upload(uris);
        }}
      />
    </>
  );
}
