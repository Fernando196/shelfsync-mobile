import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Image, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import {
  Flashlight,
  FlashlightOff,
  Package,
  Printer,
  FileText,
  CheckCircle2,
} from 'lucide-react-native';
import { hapticSelect, hapticError } from '../lib/haptics';
import { prefixQRItem } from '../const/prefix.const';
import { findProductByCode } from '../services/productLookup.service';
import { IProductLookup } from '../interfaces/productLookup.interface';
import { ReceiveBoxSheet } from '../components/ReceiveBoxSheet';
import { NotFoundSheet } from '../components/NotFoundSheet';
import { InventoryItem } from '../interfaces/item.interface';
import { formatItemCode } from '../lib/formatItemCode';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lookup, setLookup] = useState<IProductLookup | null>(null);
  const [notFoundCode, setNotFoundCode] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState<{ barcode: string; sku: string } | null>(null);
  const [savedItem, setSavedItem] = useState<InventoryItem | null>();

  useEffect(() => {
    if (!savedItem) return;

    const timer = setTimeout(() => setSavedItem(null), 3000);
    return () => clearTimeout(timer);
  }, [savedItem]);

  const onScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (loading || lookup) return;
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
          const product = await findProductByCode(data);
          if (!product) {
            setNotFoundCode(data);
            return;
          }
          console.log(product);
          setLookup(product);
        }
      } catch (e: any) {
        hapticError();
        Alert.alert('No encontrado', e?.message ?? 'No se pudo buscar el articulo');
      } finally {
        setLoading(false);
      }
    },
    [loading, lookup],
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
      {savedItem && (
        <View
          className="absolute left-0 right-0 items-center z-10"
          pointerEvents="none"
          style={{
            top: insets.top + 64,
          }}
        >
          <View className="flex-row items-center bg-emerald-600 rounded-2xl px-4 py-3 mx-4">
            <CheckCircle2 size={22} color="#fff" />
            <View className="ml-3">
              <Text className="text-white font-bold text-lg">
                {formatItemCode(savedItem.code)} guardada
              </Text>
              <Text className="text-white/80 text-base" numberOfLines={1}>
                {savedItem.name}
              </Text>
            </View>
          </View>
        </View>
      )}

      <CameraView
        style={{ flex: 1 }}
        enableTorch={torch}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'codabar', 'code128', 'code39', 'code93', 'ean13', 'upc_a', 'ean8'],
        }}
        onBarcodeScanned={loading || lookup || notFoundCode || newProduct ? undefined : onScanned}
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
        className="absolute right-6 bg-black/50 rounded-full w-11 h-11 items-center justify-center active:scale-95"
        style={{
          top: insets.top + 12,
        }}
      >
        {torch ? <FlashlightOff size={20} color="#fff" /> : <Flashlight size={20} color="#fff" />}
      </Pressable>

      {loading && (
        <View className="absolute inset-0 items-center justify-center bg-black/40">
          <ActivityIndicator color="#fff" />
        </View>
      )}

      {(lookup || newProduct) && (
        <ReceiveBoxSheet
          newProduct={newProduct}
          product={lookup}
          onClose={() => {
            setLookup(null);
            setNewProduct(null);
          }}
          onSaved={(item) => {
            setLookup(null);
            setNewProduct(null);
            setSavedItem(item);
          }}
        />
      )}
      {notFoundCode && (
        <NotFoundSheet
          code={notFoundCode}
          onClose={() => setNotFoundCode(null)}
          onFound={(product) => {
            setNotFoundCode(null);
            setLookup(product);
          }}
          onCreateNew={(sku) => {
            setNewProduct({ barcode: notFoundCode, sku });
            setNotFoundCode(null);
          }}
        />
      )}
    </View>
  );
}
