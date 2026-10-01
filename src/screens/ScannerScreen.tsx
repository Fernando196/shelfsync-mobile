import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Image, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { Flashlight, FlashlightOff, Package, Printer, FileText } from 'lucide-react-native';
import ThermalPreviewModal from '../components/ThermalPreviewModal';
import { hapticSelect, hapticError } from '../lib/haptics';
import { InventoryItem } from '../interfaces/item.interface';
import { photoUrl } from '../services/files.service';
import { formatItemCode } from '../lib/formatItemCode';
import { prefixQRItem } from '../const/prefix.const';

export default function ScannerScreen() {
  const navigation = useNavigation<any>();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [found, setFound] = useState<InventoryItem | null>(null);
  const [showPrint, setShowPrint] = useState(false);

  const onScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (loading || found) return;
      setLoading(true);
      try {
        if (data.startsWith(prefixQRItem)) {
          const id = data.slice(prefixQRItem.length);
          if (!id) {
            hapticError();
            Alert.alert('QR incorrecto', 'El id del qr es incorrecto');
            return;
          }
          navigation.navigate('ItemDetail', { id: id });
        } else {
          // TODO: codigo externo para buscar producto o agregar nuevo
        }
      } catch (e: any) {
        hapticError();
        Alert.alert('No encontrado', e?.message ?? 'No se pudo buscar el articulo');
      } finally {
        setLoading(false);
      }
    },
    [loading, found],
  );

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-8">
        <Text className="text-slate-600 text-center mb-4">
          Se necesita acceso a la camara para escanear codigos QR.
        </Text>
        <Pressable
          onPress={requestPermission}
          className="bg-primary-600 rounded-xl px-5 py-3 active:scale-95"
        >
          <Text className="text-white font-semibold">Dar permiso</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={{ flex: 1 }}
        enableTorch={torch}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'codabar', 'code128', 'code39', 'code93', 'ean13', 'upc_a', 'ean8'],
        }}
        onBarcodeScanned={loading || found ? undefined : onScanned}
      />

      {/* Retícula de enfoque */}
      <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
        <View
          style={{
            width: 240,
            height: 240,
            borderRadius: 24,
            borderWidth: 3,
            borderColor: 'rgba(79,70,229,0.9)',
          }}
        />
      </View>

      <Pressable
        onPress={() => {
          hapticSelect();
          setTorch((t) => !t);
        }}
        className="absolute top-14 right-6 bg-black/50 rounded-full w-11 h-11 items-center justify-center active:scale-95"
      >
        {torch ? <FlashlightOff size={20} color="#fff" /> : <Flashlight size={20} color="#fff" />}
      </Pressable>

      {loading && (
        <View className="absolute inset-0 items-center justify-center bg-black/40">
          <ActivityIndicator color="#fff" />
        </View>
      )}

      {found && (
        <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-5 pb-8">
          <View className="flex-row items-center">
            <View className="w-16 h-16 rounded-xl bg-slate-100 items-center justify-center overflow-hidden mr-3">
              {found.files?.[0] ? (
                <Image source={{ uri: photoUrl(found.files?.[0].url) }} className="w-16 h-16" />
              ) : (
                <Package size={26} color="#94a3b8" />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-slate-800" numberOfLines={1}>
                {found.name || found.productLookup?.sku}
              </Text>
              <Text className="text-slate-400 text-xs">SKU {found.productLookup?.sku || ''}</Text>
              <Text className="text-slate-500 text-xs mt-0.5">Stock: {found.qty}</Text>
            </View>
          </View>

          <View className="flex-row mt-5">
            <Pressable
              onPress={() => navigation.navigate('ItemDetail', { id: found.id })}
              className="flex-1 flex-row items-center justify-center bg-primary-600 rounded-xl py-3 mr-2 active:scale-95"
            >
              <FileText size={16} color="#fff" />
              <Text className="text-white font-semibold ml-2 text-sm">Ver ficha completa</Text>
            </Pressable>
            <Pressable
              onPress={() => setShowPrint(true)}
              className="flex-1 flex-row items-center justify-center bg-slate-100 rounded-xl py-3 active:scale-95"
            >
              <Printer size={16} color="#334155" />
              <Text className="text-slate-700 font-semibold ml-2 text-sm">Reimprimir</Text>
            </Pressable>
          </View>

          <Pressable onPress={() => setFound(null)} className="items-center mt-4 active:scale-95">
            <Text className="text-slate-400 text-sm">Escanear otro codigo</Text>
          </Pressable>
        </View>
      )}

      {found && (
        <ThermalPreviewModal
          visible={showPrint}
          onClose={() => setShowPrint(false)}
          product={{
            id: found.id,
            name: found.name || '',
            qty: found.qty,
            location: found.location || '',
            code: formatItemCode(found.code),
          }}
          onGoToPrinterSetup={() => {
            setShowPrint(false);
            navigation.navigate('Settings');
          }}
        />
      )}
    </View>
  );
}
