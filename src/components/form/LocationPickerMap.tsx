import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { MapPin, LocateFixed } from 'lucide-react-native';
import { hapticError, hapticSuccess } from '../../lib/haptics';
import { centeredTileGrid, TileRef, tileSource } from '../../lib/staticMap';

interface LocationPickerMapProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (coords: { latitude: number; longitude: number }) => void;
}

export default function LocationPickerMap({
  latitude,
  longitude,
  onLocationChange,
}: LocationPickerMapProps) {
  const [loading, setLoading] = useState(false);
  const [failedTiles, setFailedTiles] = useState<Set<string>>(new Set());

  const captureLocation = async () => {
    if (loading) return; // evita doble disparo si el tap llega antes de que "disabled" surta efecto
    setLoading(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Permiso requerido',
          'Se necesita acceso a la ubicacion para registrar donde esta el mueble.',
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      onLocationChange({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      hapticSuccess();
    } catch (e: any) {
      hapticError();
      Alert.alert('No se pudo obtener la ubicacion', e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  const hasCoords = latitude !== null && longitude !== null;
  const grid = hasCoords ? centeredTileGrid(latitude!, longitude!, 17, 3) : null;

  // Nuevas coordenadas -> nuevos tiles: no arrastrar el estado de "fallo" de
  // la ubicacion anterior.
  useEffect(() => {
    setFailedTiles(new Set());
  }, [latitude, longitude]);

  const tileKey = (t: TileRef) => `${t.z}/${t.x}/${t.y}`;

  return (
    <View>
      <Pressable
        onPress={captureLocation}
        disabled={loading}
        className="flex-row items-center justify-center bg-indigo-50 border border-primary-100 rounded-xl py-3 active:scale-95"
      >
        {loading ? (
          <ActivityIndicator color="#4f46e5" />
        ) : (
          <>
            <LocateFixed size={18} color="#4f46e5" />
            <Text className="text-primary-700 font-semibold ml-2">
              {hasCoords ? 'Actualizar coordenadas' : 'Obtener coordenadas actuales'}
            </Text>
          </>
        )}
      </Pressable>

      {hasCoords && grid && (
        <View
          className="mt-3 rounded-2xl overflow-hidden border border-slate-200"
          style={{ aspectRatio: 1 }}
        >
          <View className="flex-1 flex-row flex-wrap">
            {grid.flat().map((t) => {
              const key = tileKey(t);
              if (failedTiles.has(key)) {
                return (
                  <View
                    key={key}
                    className="bg-slate-100"
                    style={{ width: '33.334%', height: '33.334%' }}
                  />
                );
              }
              return (
                <Image
                  key={key}
                  source={tileSource(t)}
                  style={{ width: '33.334%', height: '33.334%' }}
                  onError={() => setFailedTiles((prev) => new Set(prev).add(key))}
                />
              );
            })}
          </View>
          <View className="absolute inset-0 items-center justify-center">
            <View className="items-center" style={{ transform: [{ translateY: -14 }] }}>
              <MapPin size={30} color="#f43f5e" fill="#f43f5e" fillOpacity={0.15} />
            </View>
          </View>
          <View className="absolute bottom-2 left-2 bg-black/60 rounded-lg px-2 py-1">
            <Text className="text-white text-[10px]">
              {latitude!.toFixed(5)}, {longitude!.toFixed(5)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
