import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { Flashlight, FlashlightOff, CheckCircle2 } from 'lucide-react-native';
import { hapticSelect, hapticError } from '../lib/haptics';
import { prefixQRItem } from '../const/prefix.const';
import { findProductByCode } from '../services/productLookup.service';
import { IProductLookup } from '../interfaces/productLookup.interface';
import { ReceiveBoxSheet } from '../components/reception/ReceiveBoxSheet';
import { NotFoundSheet } from '../components/reception/NotFoundSheet';
import { InventoryItem } from '../interfaces/item.interface';
import { formatItemCode } from '../lib/formatItemCode';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getConnectedPrinter, printInventoryTicket } from '../printing/PrinterService';
import { toTicket } from '../lib/toTicket';
import { getItemById } from '../services/items.service';
import { DETAIL_ON_SCAN } from '../const/itemStatus.const';
import { ItemStatusSheet } from '../components/item/ItemStatusSheet';
import { IToast, Toast } from '../components/ui/Toast';
import { getItemStatus } from '../lib/statusItem';
import ThermalPreviewModal from '../components/printing/ThermalPreviewModal';

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lookup, setLookup] = useState<IProductLookup | null>(null);
  const [notFoundCode, setNotFoundCode] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState<{ barcode: string; sku: string } | null>(null);
  const [printItem, setPrintItem] = useState<InventoryItem | null>(null);
  const [printed, setPrinted] = useState<boolean>(false);
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [toast, setToast] = useState<IToast | null>(null);

  const navigateDetailItem = (id: string) => navigation.navigate('ItemDetail', { id: id });

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
      setPrinted(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const onScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (loading || lookup || scannedItem) return;
      setLoading(true);
      try {
        if (data.startsWith(prefixQRItem)) {
          const id = data.slice(prefixQRItem.length);
          if (!id) {
            hapticError();
            Alert.alert('QR incorrecto', 'El id del qr es incorrecto');
            return;
          }

          const item = await getItemById(id);
          if (DETAIL_ON_SCAN.includes(item.status)) {
            navigateDetailItem(item.id);
          } else {
            setScannedItem(item);
          }
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
    [loading, lookup, scannedItem],
  );

  const handleSaveItem = async (item: InventoryItem, print: boolean) => {
    setLookup(null);
    setNewProduct(null);
    if (print) {
      const printer = getConnectedPrinter();
      if (!printer) {
        setPrintItem(item);
      } else {
        try {
          setLoading(true);
          await printInventoryTicket(toTicket(item));
          setToast({
            title: `${formatItemCode(item.code)} guardada`,
            subtitle: item.name || '',
          });
          setPrinted(true);
        } catch (err) {
          hapticError();
          setPrintItem(item);
        } finally {
          setLoading(false);
        }
      }
    } else {
      setToast({
        title: `${formatItemCode(item.code)} guardada`,
        subtitle: item.name || '',
      });
    }
  };

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
      {toast && (
        <Toast toast={toast}>
          {printed && <Text className="text-white/80 text-base">Etiqueta impresa</Text>}
        </Toast>
      )}

      <CameraView
        style={{ flex: 1 }}
        enableTorch={torch}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'codabar', 'code128', 'code39', 'code93', 'ean13', 'upc_a', 'ean8'],
        }}
        onBarcodeScanned={
          loading || lookup || notFoundCode || newProduct || printItem || scannedItem
            ? undefined
            : onScanned
        }
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
          onSaved={(item, print) => handleSaveItem(item, print)}
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

      {printItem && (
        <ThermalPreviewModal
          visible
          onClose={() => {
            setToast({
              title: `${formatItemCode(printItem.code)} guardada`,
              subtitle: printItem.name || '',
            });
            setPrintItem(null);
          }}
          product={{
            id: printItem.id,
            name: printItem.name || '',
            qty: printItem.qty,
            location: printItem.location || '',
            code: printItem.code,
          }}
          onGoToPrinterSetup={() => {
            setPrintItem(null);
            navigation.navigate('Settings');
          }}
        />
      )}

      {scannedItem && (
        <ItemStatusSheet
          item={scannedItem}
          onUpdate={(item) => {
            setToast({
              title: `${formatItemCode(item.code)} → ${getItemStatus(item).label}`,
              subtitle: item.name || item.productLookup.description || '',
            });
            setScannedItem(null);
          }}
          onClose={() => setScannedItem(null)}
          onViewDetail={() => {
            setScannedItem(null);
            navigateDetailItem(scannedItem.id);
          }}
        />
      )}
    </View>
  );
}
