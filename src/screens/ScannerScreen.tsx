import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { Flashlight, FlashlightOff, Keyboard, Search } from 'lucide-react-native';
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
import { NoLabelSheet } from '../components/reception/NoLabelSheet';

export default function ScannerScreen() {
  const { t } = useTranslation();
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
            Alert.alert(t('scanner.invalidQrTitle'), t('scanner.invalidQrMessage'));
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
        Alert.alert(t('scanner.notFoundTitle'), e?.message ?? t('scanner.searchFailed'));
      } finally {
        setLoading(false);
      }
    },
    [loading, sheet],
  );

  const toastSaved = (item: IInventoryItem) =>
    setToast({
      title: t('scanner.saved', { code: formatItemCode(item.code) }),
      subtitle: item.name || '',
    });

  // El item ya quedo guardado; si no se pudo imprimir solo se avisa, sin pasos extra.
  const handleSaveItem = async (item: IInventoryItem, print: boolean) => {
    cleanSheet();
    if (!print) {
      toastSaved(item);
      return;
    }
    if (!getConnectedPrinter()) {
      hapticError();
      Alert.alert(t('scanner.savedNotPrinted'), t('scanner.noPrinter'), [
        { text: t('common.ok'), style: 'cancel', onPress: () => toastSaved(item) },
        { text: t('common.goToSettings'), onPress: () => navigation.navigate('Settings') },
      ]);
      return;
    }
    try {
      setLoading(true);
      await printInventoryTicket(toTicket(item));
      toastSaved(item);
      setPrinted(true);
    } catch (e: any) {
      hapticError();
      Alert.alert(t('scanner.savedNotPrinted'), e?.message ?? String(e), [
        { text: t('common.ok'), onPress: () => toastSaved(item) },
      ]);
    } finally {
      setLoading(false);
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
      <View className="flex-1 items-center justify-center bg-white dark:bg-slate-900 px-8">
        <Text className="text-slate-600 dark:text-slate-300 text-center mb-4">
          {t('scanner.cameraPermission')}
        </Text>
        <Pressable
          onPress={requestPermission}
          className="bg-primary-600 dark:bg-slate-600 rounded-xl px-5 py-3 active:scale-95"
        >
          <Text className="text-white font-semibold">{t('scanner.grantPermission')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {toast && (
        <Toast toast={toast}>
          {printed && <Text className="text-white/80 text-base">{t('detail.labelPrinted')}</Text>}
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
            borderColor: 'rgba(5,150,105,0.9)',
          }}
        />
      </View>

      <Pressable
        onPress={() => {
          hapticSelect();
          setTorch((on) => !on);
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
          newProduct={
            sheet.kind === 'new'
              ? { barcode: sheet.barcode, sku: sheet.sku, description: sheet.description }
              : null
          }
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

      {sheet?.kind === 'manual' && (
        <NotFoundSheet
          onClose={cleanSheet}
          onFound={(product) => setSheet({ kind: 'receive', product })}
          onCreateNew={(sku) => setSheet({ kind: 'new', sku })}
        />
      )}

      {sheet?.kind === 'search' && (
        <NoLabelSheet
          onSelect={(product) => setSheet({ kind: 'receive', product })}
          onCreate={(description) => setSheet({ kind: 'new', description })}
          onClose={cleanSheet}
        />
      )}

      {!sheet && (
        // Si la etiqueta no escanea: buscar sin etiqueta (por descripcion) o escribir el SKU.
        <View
          className="absolute left-0 right-0 flex-row justify-center gap-3"
          style={{ bottom: 56 }}
        >
          <Pressable
            onPress={() => {
              hapticSelect();
              setSheet({ kind: 'search' });
            }}
            className="flex-row items-center bg-black/50 rounded-full px-5 py-3 active:scale-95"
          >
            <Search size={18} color="#fff" />
            <Text className="text-white font-semibold text-sm ml-2">{t('scanner.noLabel')}</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              hapticSelect();
              setSheet({ kind: 'manual' });
            }}
            className="flex-row items-center bg-black/50 rounded-full px-5 py-3 active:scale-95"
          >
            <Keyboard size={18} color="#fff" />
            <Text className="text-white font-semibold text-sm ml-2">{t('scanner.typeSku')}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

type Sheet =
  | { kind: 'receive'; product: IProductLookup }
  | { kind: 'new'; barcode?: string; sku?: string; description?: string }
  | { kind: 'notFound'; code: string }
  | { kind: 'status'; item: IInventoryItem }
  | { kind: 'search' }
  | { kind: 'manual' };
