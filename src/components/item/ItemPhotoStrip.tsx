import { useState } from 'react';
import { View, Text, Image, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Camera, ImagePlus, RotateCw, Star, Trash2 } from 'lucide-react-native';
import { IInventoryItem, IInventoryPhoto } from '../../interfaces/item.interface';
import { deletePhoto, photoUrl, setCoverPhoto, uploadPhoto } from '../../services/files.service';
import { hapticTap, hapticSuccess, hapticError } from '../../lib/haptics';
import { pickFromLibrary } from '../../lib/pickFromLibrary';
import { CameraCaptureModal } from '../camera/CameraCaptureModal';
import { PhotoViewer } from './PhotoViewer';
import { COLORS } from '../../const/theme.const';

interface PendingPhoto {
  uri: string;
  failed: boolean;
}

interface ItemPhotoStripProps {
  item: IInventoryItem;
  // Item actualizado por la API tras subir o borrar una foto.
  onChange: (item: IInventoryItem) => void;
}

const PHOTO_HEIGHT = 200;

// Botones redondos sobre cada foto (estrella y basura).
const photoButtonStyle = {
  position: 'absolute',
  top: 8,
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: 'rgba(0,0,0,0.5)',
  alignItems: 'center',
  justifyContent: 'center',
} as const;

export function ItemPhotoStrip({ item, onChange }: ItemPhotoStripProps) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [coverSettingId, setCoverSettingId] = useState<string | null>(null);
  const files = item.files ?? [];
  // Mas reciente primero, igual que en la tira.
  const photos = [...files].reverse();
  const coverIndex = photos.findIndex((p) => p.id === item.cover?.id);
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
        onChange(updated);
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

  const makeCover = async (photo: IInventoryPhoto) => {
    hapticTap();
    setCoverSettingId(photo.id);
    try {
      onChange(await setCoverPhoto(item.id, photo.id));
      hapticSuccess();
    } catch (e: any) {
      hapticError();
      Alert.alert('No se pudo cambiar la portada', e?.message ?? String(e));
    } finally {
      setCoverSettingId(null);
    }
  };

  const confirmDelete = (photo: IInventoryPhoto) => {
    hapticTap();
    Alert.alert('Eliminar foto', 'Esta foto se borrara del producto. No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          setDeletingId(photo.id);
          try {
            const updated = await deletePhoto(item.id, photo.id);
            // Si era la ultima foto, el visor no tiene nada que mostrar.
            if (!updated.files?.length) setViewerIndex(null);
            onChange(updated);
            hapticSuccess();
          } catch (e: any) {
            hapticError();
            Alert.alert('No se pudo eliminar la foto', e?.message ?? String(e));
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  return (
    <>
      {isEmpty ? (
        <View
          className="w-full bg-primary-50 border border-dashed border-primary-200 rounded-2xl mb-4 overflow-hidden"
          style={{ height: PHOTO_HEIGHT }}
        >
          <Pressable
            onPress={openCamera}
            className="flex-1 items-center justify-center active:opacity-70"
          >
            <Camera size={32} color={COLORS.primary} />
            <Text className="text-primary-600 font-semibold mt-2">Tomar fotos</Text>
          </Pressable>
          <Pressable
            onPress={openLibrary}
            className="flex-row items-center justify-center py-3 border-t border-primary-200 active:opacity-70"
          >
            <ImagePlus size={16} color={COLORS.primary} />
            <Text className="text-primary-600 ml-2">Elegir de galeria</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1 mb-4">
          <View
            className="mx-1 w-28 bg-primary-50 border border-dashed border-primary-200 rounded-2xl overflow-hidden"
            style={{ height: PHOTO_HEIGHT }}
          >
            <Pressable
              onPress={openCamera}
              className="flex-1 items-center justify-center active:opacity-70"
            >
              <Camera size={26} color={COLORS.primary} />
              <Text className="text-primary-600 text-xs font-semibold mt-1">Tomar</Text>
            </Pressable>
            <Pressable
              onPress={openLibrary}
              className="items-center justify-center py-3 border-t border-primary-200 active:opacity-70"
            >
              <ImagePlus size={18} color={COLORS.primary} />
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
            <Pressable
              key={p.id}
              onPress={() => setViewerIndex(i)}
              className="mx-1 active:opacity-80"
              style={{ width: 260, height: PHOTO_HEIGHT }}
            >
              <Image source={{ uri: photoUrl(p.url) }} className="rounded-2xl w-full h-full" />
              {i === coverIndex && (
                <View
                  style={{
                    position: 'absolute',
                    left: 8,
                    bottom: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    borderRadius: 999,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}
                >
                  <Star size={12} color="#facc15" fill="#facc15" />
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600', marginLeft: 4 }}>
                    Portada
                  </Text>
                </View>
              )}
              <Pressable
                onPress={() => makeCover(p)}
                // La portada actual no se vuelve a elegir; la estrella llena la marca.
                disabled={i === coverIndex || coverSettingId !== null}
                hitSlop={8}
                style={({ pressed }) => ({ ...photoButtonStyle, left: 8, opacity: pressed ? 0.7 : 1 })}
              >
                {coverSettingId === p.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Star
                    size={16}
                    color={i === coverIndex ? '#facc15' : '#fff'}
                    fill={i === coverIndex ? '#facc15' : 'none'}
                  />
                )}
              </Pressable>
              {/* Layout en style: en web NativeWind no aplicaba estas clases a este Pressable */}
              <Pressable
                onPress={() => confirmDelete(p)}
                disabled={deletingId !== null}
                hitSlop={8}
                style={({ pressed }) => ({ ...photoButtonStyle, right: 8, opacity: pressed ? 0.7 : 1 })}
              >
                {deletingId === p.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Trash2 size={16} color="#fff" />
                )}
              </Pressable>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <PhotoViewer
        urls={photos.map((p) => photoUrl(p.url))}
        index={viewerIndex}
        onClose={() => setViewerIndex(null)}
        onDelete={(i) => confirmDelete(photos[i])}
        deleting={deletingId !== null}
        coverIndex={coverIndex}
        onSetCover={(i) => makeCover(photos[i])}
        settingCover={coverSettingId !== null}
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
