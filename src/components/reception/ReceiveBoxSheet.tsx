import { Boxes, Minus, Package, Plus } from 'lucide-react-native';
import { parseMoney } from '../../lib/money';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, Alert, Switch } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { Input } from '../ui/Input';
import { IInventoryItem, IUpsertItemInput } from '../../interfaces/item.interface';
import { generateUuid } from '../../lib/uuid';
import { hapticError, hapticSuccess } from '../../lib/haptics';
import { createItem } from '../../services/items.service';
import * as Location from 'expo-location';
import { uploadPhoto } from '../../services/files.service';
import { BottomSheet, BottomSheetHandle } from '../ui/BottomSheet';
import { IProductLookup } from '../../interfaces/productLookup.interface';
import PhotoPicker from '../form/PhotoPicker';
import { useInventory } from '../../state/InventoryContext';
import CategoryAutocomplete from '../form/CategoryAutocomplete';
import { COLORS } from '../../const/theme.const';

function emptyForm() {
  return {
    qty: 1,
    location: '',
    notes: '',
    latitude: null as number | null,
    longitude: null as number | null,
    photos: [] as string[],
    description: '',
    needAssembly: false,
    categoryId: '',
    cost: '',
  };
}

export function ReceiveBoxSheet({ product, newProduct, onClose, onSaved }: IReceiveBoxSheetProps) {
  const { t } = useTranslation();
  const sheetRef = useRef<BottomSheetHandle>(null);
  const [form, setForm] = useState(() => ({
    ...emptyForm(),
    description: newProduct?.description ?? '',
  }));
  const [saving, setSaving] = useState<boolean>(false);
  const { addItem } = useInventory();

  useEffect(() => {
    (async () => {
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(
            t('reception.locationPermissionTitle'),
            t('reception.locationPermissionMessage'),
          );
          return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setForm((props) => ({
          ...props,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }));
      } catch (e: any) {
        hapticError();
        Alert.alert(t('reception.locationFailed'), e?.message ?? String(e));
      }
    })();
  }, []);

  const set = <K extends keyof ReturnType<typeof emptyForm>>(
    key: K,
    value: ReturnType<typeof emptyForm>[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async (print: boolean) => {
    setSaving(true);
    try {
      const item: IUpsertItemInput = {
        id: generateUuid(),
        name: product?.description || form.description.trim() || '',
        qty: form.qty,
        location: form.location,
        notes: form.notes?.trim(),
        cost: parseMoney(form.cost),
        longitude: form.longitude || undefined,
        latitude: form.latitude || undefined,
        categoryId: form.categoryId || undefined,
        ...(product
          ? { productLookupId: product.id }
          : {
              productLookup: {
                barcode: newProduct?.barcode || undefined,
                sku: newProduct?.sku || undefined,
                description: form.description,
                needAssembly: form.needAssembly,
              },
            }),
      };

      let newItem: IInventoryItem = await createItem(item);

      for (const uri of form.photos) {
        newItem = await uploadPhoto(newItem.id, uri);
      }

      addItem(newItem);

      hapticSuccess();
      onSaved(newItem, print);
    } catch (e: any) {
      hapticError();
      Alert.alert(t('reception.saveFailed'), e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      ref={sheetRef}
      title={newProduct ? t('reception.newProduct') : t('reception.receiveBox')}
      onClose={onClose}
    >
      <View className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-3">
        <View className="flex flex-row items-center">
          <View className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-600 items-center justify-center mr-3">
            <Package size={22} color="#64748b" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-slate-800 dark:text-slate-100" numberOfLines={2}>
              {product?.description || form.description.trim() || t('reception.noDescription')}
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              {t('reception.barcode', {
                value: product?.barcode || newProduct?.barcode || t('reception.noBarcode'),
              })}
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              {t('reception.sku', { value: product?.sku || newProduct?.sku || t('reception.noSku') })}
            </Text>
          </View>
        </View>
        {newProduct && (
          <View className="mt-2">
            <Input
              label={t('reception.manifestDescription')}
              value={form.description}
              onChangeText={(v) => set('description', v)}
              multiline
              textAlignVertical="top"
            />
            <View className="flex flex-row items-center gap-4 mt-3">
              <Text className="text-slate-800 dark:text-slate-100">{t('actions.requiresAssembly')}</Text>
              <Switch
                trackColor={{ false: '#cbd5e1', true: '#6ee7b7' }}
                thumbColor={COLORS.accent}
                value={form.needAssembly}
                onValueChange={(v) => set('needAssembly', v)}
              />
            </View>
          </View>
        )}
      </View>

      <View className="flex flex-col bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 mt-3">
        <View className="flex flex-row gap-4">
          <Boxes size={18} color={COLORS.primary} />
          <Text className="text-base font-bold text-slate-800 dark:text-slate-100">{t('reception.stockSection')}</Text>
        </View>
        <View className="flex-row items-center self-start bg-slate-100 dark:bg-slate-700 rounded-xl mb-4">
          <Pressable
            onPress={() => set('qty', Math.max(1, form.qty - 1))}
            className="w-11 h-11 items-center justify-center active:scale-95"
          >
            <Minus size={18} color={COLORS.primary} />
          </Pressable>
          <Text className="w-10 text-center text-lg font-bold text-slate-800 dark:text-slate-100">{form.qty}</Text>
          <Pressable
            onPress={() => set('qty', form.qty + 1)}
            className="w-11 h-11 items-center justify-center active:scale-95"
          >
            <Plus size={18} color={COLORS.primary} />
          </Pressable>
        </View>

        {/* Opcional: a veces no se sabe al recibir; se puede llenar despues en Editar. */}
        <Input
          label={t('pricing.costOptional')}
          value={form.cost}
          onChangeText={(v) => set('cost', v)}
          keyboardType="decimal-pad"
          placeholder="0.00"
          className="mb-2"
        />

        <Input
          label={t('reception.warehouseLocation')}
          value={form.location}
          onChangeText={(v) => set('location', v)}
          placeholder={t('reception.locationPlaceholder')}
        />

        <Input
          label={t('reception.notes')}
          multiline
          textAlignVertical="top"
          value={form.notes}
          onChangeText={(v) => set('notes', v)}
          placeholder={t('reception.notesPlaceholder')}
          placeholderTextColor="#94a3b8"
          className="mt-2"
        />

        <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400 my-2">{t('reception.categoryOptional')}</Text>
        <CategoryAutocomplete
          label={t('reception.searchCategory')}
          onChange={(id) => set('categoryId', id)}
          selected={form.categoryId || ''}
        />

        <View className="mt-4">
          <Text className="text-base font-bold mb-4 text-slate-800 dark:text-slate-100">{t('reception.photosSection')}</Text>
          <PhotoPicker photos={form.photos} onChange={(p) => set('photos', p)} />
        </View>
      </View>

      <Pressable
        className={` bg-primary-600 dark:bg-slate-600 rounded-xl py-3 items-center mt-3 ${saving || (!!newProduct && !form.description.trim()) ? 'opacity-50' : ''}`}
        disabled={saving || (!!newProduct && !form.description.trim())}
        onPress={() => handleSave(true)}
      >
        <Text className="text-sm font-semibold text-white">{t('reception.saveAndPrint')}</Text>
      </Pressable>

      <View className="flex-row mt-5">
        <Pressable
          onPress={() => sheetRef.current?.close()}
          className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-xl py-3 mr-2 items-center"
        >
          <Text className="text-slate-700 dark:text-slate-200 font-semibold text-sm">{t('common.cancel')}</Text>
        </Pressable>
        <Pressable
          className={`flex-1 bg-slate-100 dark:bg-slate-700 rounded-xl py-3 items-center ${saving || (!!newProduct && !form.description.trim()) ? 'opacity-50' : ''}`}
          disabled={saving || (!!newProduct && !form.description.trim())}
          onPress={() => handleSave(false)}
        >
          <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('reception.saveOnly')}</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

export interface IReceiveBoxSheetProps {
  product: IProductLookup | null;
  newProduct?: { barcode?: string; sku?: string; description?: string } | null;
  onClose: () => void;
  onSaved: (item: IInventoryItem, print: boolean) => void;
}
