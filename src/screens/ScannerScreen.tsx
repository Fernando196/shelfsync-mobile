import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { Flashlight, FlashlightOff } from 'lucide-react-native';
import { hapticSelect, hapticError } from '../lib/haptics';
import { prefixQRItem } from '../const/prefix.const';
import { findProductByCode } from '../services/productLookup.service';
import { IProductLookup } from '../interfaces/productLookup.interface';
import { ReceiveBoxSheet } from '../components/reception/ReceiveBoxSheet';
import { NotFoundSheet } from '../components/reception/NotFoundSheet';
import { IInventoryItem } from '../interfaces/item.interface';
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
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [printed, setPrinted] = useState<boolean>(false);
  const [toast, setToast] = useState<IToast | null>(null);
  const isFocused = useIsFocused();

  const navigateDetailItem = (id: string) => navigation.navigate('ItemDetail', { id: id });
  const cleanSheet = () => setSheet(null);

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
      if (loading || sheet) return;
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
            setSheet({ kind: 'status', item });
          }
        } else {
          // TODO: codigo externo para buscar producto o agregar nuevo
          const product = await findProductByCode(data);
          if (!product) {
            setSheet({ kind: 'notFound', code: data });
            return;
          }
          setSheet({ kind: 'receive', product });
        }
      } catch (e: any) {
        hapticError();
        Alert.alert('No encontrado', e?.message ?? 'No se pudo buscar el articulo');
      } finally {
        setLoading(false);
      }
    },
    [loading, sheet],
  );

  const handleSaveItem = async (item: IInventoryItem, print: boolean) => {
    cleanSheet();
    if (print) {
      const printer = getConnectedPrinter();
      if (!printer) {
        setSheet({ kind: 'print', item });
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
          setSheet({ kind: 'print', item });
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

      {isFocused && (
        <CameraView
          style={{ flex: 1 }}
          enableTorch={torch}
          barcodeScannerSettings={{
            barcodeTypes: [
              'qr',
              'codabar',
              'code128',
              'code39',
              'code93',
              'ean13',
              'upc_a',
              'ean8',
            ],
          }}
          onBarcodeScanned={loading || sheet ? undefined : onScanned}
        />
      )}

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

      {(sheet?.kind === 'receive' || sheet?.kind === 'new') && (
        <ReceiveBoxSheet
          newProduct={sheet.kind === 'new' ? { barcode: sheet.barcode, sku: sheet.sku } : null}
          product={sheet.kind === 'receive' ? sheet.product : null}
          onClose={cleanSheet}
          onSaved={(item, print) => handleSaveItem(item, print)}
        />
      )}
      {sheet?.kind === 'notFound' && (
        <NotFoundSheet
          code={sheet.code}
          onClose={cleanSheet}
          onFound={(product) => {
            setSheet({ kind: 'receive', product });
          }}
          onCreateNew={(sku) => {
            setSheet({ kind: 'new', barcode: sheet.code, sku });
          }}
        />
      )}

      {sheet?.kind === 'print' && (
        <ThermalPreviewModal
          visible
          onClose={() => {
            setToast({
              title: `${formatItemCode(sheet.item.code)} guardada`,
              subtitle: sheet.item.name || '',
            });
            cleanSheet();
          }}
          product={{
            id: sheet.item.id,
            name: sheet.item.name || '',
            qty: sheet.item.qty,
            location: sheet.item.location || '',
            code: sheet.item.code,
          }}
          onGoToPrinterSetup={() => {
            cleanSheet();
            navigation.navigate('Settings');
          }}
        />
      )}

      {sheet?.kind === 'status' && (
        <ItemStatusSheet
          item={sheet.item}
          onUpdate={(item) => {
            setToast({
              title: `${formatItemCode(item.code)} → ${getItemStatus(item).label}`,
              subtitle: item.name || item.productLookup.description || '',
            });
            cleanSheet();
          }}
          onClose={cleanSheet}
          onViewDetail={() => {
            cleanSheet();
            navigateDetailItem(sheet.item.id);
          }}
        />
      )}
    </View>
  );
}

type Sheet =
  | { kind: 'receive'; product: IProductLookup }
  | { kind: 'new'; barcode: string; sku: string }
  | { kind: 'notFound'; code: string }
  | { kind: 'print'; item: IInventoryItem }
  | { kind: 'status'; item: IInventoryItem };
