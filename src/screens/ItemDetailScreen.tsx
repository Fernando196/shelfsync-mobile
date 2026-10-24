import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable, Alert } from 'react-native';
import { useRoute, useNavigation, useFocusEffect, RouteProp } from '@react-navigation/native';
import { MapPin, Boxes, Tag, Printer, TriangleAlert, Pencil, Store } from 'lucide-react-native';
import { MarketplaceSheet } from '../components/item/MarketplaceSheet';
import { SalePrice } from '../components/item/SalePrice';
import { SoldPriceSheet } from '../components/item/SoldPriceSheet';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { IInventoryItem } from '../interfaces/item.interface';
import { getItemById } from '../services/items.service';
import { formatItemCode } from '../lib/formatItemCode';
import StatusPill from '../components/item/StatusPill';
import { getItemStatus } from '../lib/statusItem';
import { ITEM_ACTIONS, ITEM_STATUS } from '../const/itemStatus.const';
import { useTranslation } from 'react-i18next';
import { CommentSheet } from '../components/item/CommentSheet';
import { useItemStatusAction } from '../hooks/useItemStatusAction';
import { isPrinterReady, printLabel } from '../printing/printLabel';
import { hapticError, hapticSuccess } from '../lib/haptics';
import { IToast, Toast } from '../components/ui/Toast';
import { StatusHistory } from '../components/item/StatusHistory';
import { useInventory } from '../state/InventoryContext';
import { ItemPhotoStrip } from '../components/item/ItemPhotoStrip';
import { COLORS } from '../const/theme.const';
import { Screen } from '../components/ui/Screen';
import { BackButton } from '../components/ui/BackButton';

export default function ItemDetailScreen() {
  const { t } = useTranslation();
  const route = useRoute<RouteProp<RootStackParamList, 'ItemDetail'>>();
  const navigation = useNavigation<any>();
  const { id } = route.params;
  const [item, setItem] = useState<IInventoryItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);
  const [toast, setToast] = useState<IToast | null>(null);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [loading, setLoading] = useState(true);
  // El cambio de estatus puede responder sin fotos/producto: se combina con lo que ya hay.
  const { changing, pendingAction, handleAction, runAction, cancelComment } = useItemStatusAction(
    id,
    (next) => setItem((prev) => (prev ? { ...prev, ...next } : next)),
  );
  const { updateItem } = useInventory();

  useEffect(() => {
    if (item != null) {
      updateItem(item);
    }
  }, [item, updateItem]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Un solo toque: imprime directo. Solo se interrumpe si no hay impresora o falla.
  const handlePrint = async () => {
    if (!item) return;
    if (!isPrinterReady()) {
      hapticError();
      Alert.alert(t('detail.noPrinterTitle'), t('detail.noPrinterMessage'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.goToSettings'), onPress: () => navigation.navigate('Settings') },
      ]);
      return;
    }
    setPrinting(true);
    try {
      await printLabel(item);
      hapticSuccess();
      setToast({ title: t('detail.labelPrinted'), subtitle: item.name || '' });
    } catch (e: any) {
      hapticError();
      Alert.alert(t('detail.printError'), e?.message ?? String(e));
    } finally {
      setPrinting(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setError(null);
      setLoading(true);
      getItemById(id)
        .then((i) => {
          if (active) setItem(i);
        })
        .catch((e) => {
          if (active) setError(e.message);
          // TODO: 404 => "Este item ya no existe"
        })
        .finally(() => {
          if (active) setLoading(false);
        });

      return () => {
        active = false;
      };
    }, [id]),
  );

  if (error) {
    return (
      <Screen>
        <View className="px-5 pb-2">
          <BackButton />
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <TriangleAlert size={32} color="#f43f5e" />
          <Text className="text-slate-600 dark:text-slate-300 text-center mt-3">{error}</Text>
        </View>
      </Screen>
    );
  }

  if (loading && !item) {
    return (
      <View className="flex-1 items-center justify-center bg-surface dark:bg-slate-950">
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (!item) return null;

  const status = getItemStatus(item);
  const actions = ITEM_ACTIONS[item.status] ?? [];

  return (
    <Screen>
      {/* Encabezado propio (sin header nativo), mismo estilo que Inventario */}
      <View className="flex-row items-center justify-between px-5 pb-2">
        <View className="flex-row items-center">
          <BackButton />
          <Text className="text-2xl font-bold text-slate-800 dark:text-slate-100 ml-3">{t('detail.title')}</Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('EditProduct', { id: item.id })}
          hitSlop={8}
          className="w-11 h-11 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 items-center justify-center active:opacity-70"
        >
          <Pencil size={18} color={COLORS.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 40 }}>
        <ItemPhotoStrip item={item} onChange={setItem} />
        {/* Nombre, codigo/SKU y estatus con aire entre cada uno */}
        <Text className="text-2xl font-bold text-slate-900 dark:text-slate-50 leading-tight">
          {item.name || item.productLookup.description}
        </Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {formatItemCode(item.code)}
          {item.productLookup?.sku ? `  ·  SKU ${item.productLookup.sku}` : ''}
        </Text>
        {/* Precio de venta (editable ahi mismo); costo y ganancia debajo. */}
        <SalePrice item={item} onSaved={(updated) => setItem((prev) => ({ ...prev, ...updated }))} />

        <View className="mt-3">
          <StatusPill label={status.label} tone={status.tone} />
        </View>

        <View className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-2 mt-5">
          <View className="flex-row items-center py-2">
            <Boxes size={16} color="#64748b" />
            <Text className="text-slate-500 dark:text-slate-400 ml-2 flex-1">{t('detail.quantity')}</Text>
            <Text className="font-semibold text-slate-800 dark:text-slate-100">{item.qty}</Text>
          </View>
          <View className="h-px bg-slate-100 dark:bg-slate-700" />
          <View className="flex-row items-center py-2">
            <MapPin size={16} color="#64748b" />
            <Text className="text-slate-500 dark:text-slate-400 ml-2 flex-1">{t('detail.location')}</Text>
            <Text className="font-semibold text-slate-800 dark:text-slate-100">{item.location || '-'}</Text>
          </View>
          <View className="h-px bg-slate-100 dark:bg-slate-700" />
          <View className="flex-row items-center py-2">
            <Tag size={16} color="#64748b" />
            <Text className="text-slate-500 dark:text-slate-400 ml-2 flex-1">{t('detail.category')}</Text>
            <Text className="font-semibold text-slate-800 dark:text-slate-100">{item.category?.name || '-'}</Text>
          </View>
        </View>

        {/* Cambios de estatus en su propia seccion: principal relleno, otros con contorno,
            danado como enlace para que no compita con el siguiente paso. */}
        {actions.length > 0 && (
          <View className="mt-6">
            <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              {t('detail.nextStep')}
            </Text>
            {actions
              .filter((a) => a.variant !== 'danger')
              .map((action) => (
                <Pressable
                  key={action.to}
                  disabled={changing}
                  onPress={() => handleAction(action)}
                  className={`items-center rounded-xl py-3.5 mb-2 active:opacity-80 ${
                    action.variant === 'primary'
                      ? 'bg-accent-600'
                      : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600'
                  } ${changing ? 'opacity-50' : ''}`}
                >
                  <Text
                    className={`text-base font-semibold ${
                      action.variant === 'primary' ? 'text-white' : 'text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            {actions
              .filter((a) => a.variant === 'danger')
              .map((action) => (
                <Pressable
                  key={action.to}
                  disabled={changing}
                  onPress={() => handleAction(action)}
                  className="flex-row items-center justify-center py-3 active:opacity-70"
                >
                  <TriangleAlert size={16} color="#e11d48" />
                  <Text className="text-rose-600 dark:text-rose-400 font-semibold ml-2">
                    {t('detail.markAs', { status: ITEM_STATUS[action.to].label.toLowerCase() })}
                  </Text>
                </Pressable>
              ))}
          </View>
        )}

        <Pressable
          onPress={handlePrint}
          disabled={printing}
          className="flex-row items-center justify-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl py-3.5 mt-4 active:opacity-80"
        >
          {printing ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <>
              <Printer size={18} color={COLORS.primary} />
              <Text className="text-slate-800 dark:text-slate-100 font-semibold ml-2">{t('detail.reprint')}</Text>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={() => setShowMarketplace(true)}
          className="flex-row items-center justify-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl py-3.5 mt-3 active:opacity-80"
        >
          <Store size={18} color={COLORS.primary} />
          <Text className="text-slate-800 dark:text-slate-100 font-semibold ml-2">{t('marketplace.open')}</Text>
        </Pressable>

        <StatusHistory itemId={item.id} status={item.status} />
      </ScrollView>

      {toast && <Toast toast={toast} />}

      {showMarketplace && (
        <MarketplaceSheet item={item} onClose={() => setShowMarketplace(false)} />
      )}

      {pendingAction?.needsPrice && (
        <SoldPriceSheet
          currentPrice={item.price}
          onClose={cancelComment}
          onConfirm={(price) => runAction(pendingAction, undefined, price)}
          loading={changing}
        />
      )}
      {pendingAction?.needsComment && (
        <CommentSheet
          onClose={cancelComment}
          onConfirm={(comment) => runAction(pendingAction, comment)}
          loading={changing}
          title={t('detail.damagedTitle')}
        />
      )}
    </Screen>
  );
}
