import { useRef, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

export function CameraCaptureModal({ visible, onClose, onDone }: CameraCaptureModalProps) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [shots, setShots] = useState<string[]>([]);
  const stripRef = useRef<ScrollView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const takeShot = async () => {
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.6 });
    if (photo) setShots((prev) => [...prev, photo.uri]);
  };

  const removeShot = (uri: string) => setShots((prev) => prev.filter((p) => p !== uri));

  const handleClose = () => {
    setShots([]);
    onClose();
  };

  return (
    <Modal animationType="slide" onRequestClose={handleClose} visible={visible}>
      <View className="flex-1 bg-black">
        {permission?.granted ? (
          <CameraView ref={cameraRef} style={{ flex: 1 }} />
        ) : (
          <View className="flex-1 items-center justify-center bg-white px-8">
            <Text className="text-slate-600 text-center mb-4">
              Se necesita acceso a la camara para tomar fotos
            </Text>
            <Pressable
              onPress={requestPermission}
              className="bg-primary-600 rounded-xl px-5 py-3 active:scale-95"
            >
              <Text className="text-white font-semibold">Dar permiso</Text>
            </Pressable>
          </View>
        )}
        <View
          className="absolute bottom-0 left-0 right-0 gap-4"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="pt-2"
            contentContainerStyle={{ paddingHorizontal: 24 }}
            ref={stripRef}
            onContentSizeChange={() => stripRef.current?.scrollToEnd()}
          >
            {shots.map((uri) => (
              <View key={uri} className="mr-3">
                <Image source={{ uri }} className="w-24 h-24 rounded-xl" />
                <Pressable
                  onPress={() => removeShot(uri)}
                  className="absolute -top-2 -right-2 bg-rose-500 rounded-full w-6 h-6 items-center justify-center active:scale-95"
                >
                  <X size={14} color="#fff" />
                </Pressable>
              </View>
            ))}
          </ScrollView>
          <View className="flex-row items-center justify-between px-6 gap-4">
            <Pressable
              onPress={handleClose}
              className="flex-1 bg-slate-100 rounded-xl py-3 items-center"
            >
              <Text className="text-slate-700 font-semibold text-sm">Cancelar</Text>
            </Pressable>
            <Pressable
              className="w-20 h-20 rounded-full bg-white border-4 border-slate-300 justify-center items-center"
              onPress={takeShot}
            >
              <Text>{shots.length}</Text>
            </Pressable>
            <Pressable
              className={`flex-1 rounded-xl py-3 items-center bg-primary-600 ${shots.length === 0 ? 'opacity-50' : ''}`}
              onPress={() => {
                onDone(shots);
                setShots([]);
              }}
              disabled={shots.length === 0}
            >
              <Text className="font-semibold text-sm text-white">Listo ({shots.length})</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export interface CameraCaptureModalProps {
  visible: boolean;
  onClose: () => void;
  onDone: (uris: string[]) => void;
}
