import { Boxes, Minus, Package, Plus } from 'lucide-react-native';
import { View, Text, Pressable, Alert, Switch } from 'react-native';
import { useEffect, useState } from 'react';
import { Input } from './ui/Input';
import { InventoryItem, UpsertItemInput } from '../interfaces/item.interface';
import { generateUuid } from '../lib/uuid';
import { hapticError, hapticSuccess } from '../lib/haptics';
import { createItem } from '../services/items.service';
import * as Location from 'expo-location';
import PhotoPicker from './PhotoPicker';
import { uploadPhoto } from '../services/files.service';
import { BottomSheet } from './ui/BottomSheet';
import { IProductLookup } from '../interfaces/productLookup.interface';

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
  };
}

export function ReceiveBoxSheet({ product, newProduct, onClose }: IReceiveBoxSheetProps) {
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
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
        setForm((props) => ({
          ...props,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }));
        hapticSuccess();
      } catch (e: any) {
        hapticError();
        Alert.alert('No se pudo obtener la ubicacion', e?.message ?? String(e));
      }
    })();
  }, []);

  const set = <K extends keyof ReturnType<typeof emptyForm>>(
    key: K,
    value: ReturnType<typeof emptyForm>[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const handleSanvig = async () => {
    setSaving(true);
    try {
      const item: UpsertItemInput = {
        id: generateUuid(),
        name: product?.description || form.description.trim() || '',
        qty: form.qty,
        location: form.location,
        notes: form.notes?.trim(),
        longitude: form.longitude || undefined,
        latitude: form.latitude || undefined,
        ...(product
          ? { productLookupId: product.id }
          : {
              productLookup: {
                barcode: newProduct?.barcode,
                sku: newProduct?.sku,
                description: form.description,
                needAssembly: form.needAssembly,
              },
            }),
      };

      const newItem: InventoryItem = await createItem(item);

      for (const uri of form.photos) {
        await uploadPhoto(newItem.id, uri);
      }
      onClose();
    } catch (e: any) {
      hapticError();
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet title={newProduct ? 'Producto nuevo' : 'Recibir caja'}>
      <View className="bg-slate-50 rounded-2xl p-3">
        <View className="flex flex-row items-center">
          <View className="w-12 h-12 rounded-xl bg-slate-200 items-center justify-center mr-3">
            <Package size={22} color="#64748b" />
          </View>
          <View>
            <Text className="text-base font-semibold text-slate-800" numberOfLines={2}>
              {product?.description || form.description.trim() || 'Sin descripción'}
            </Text>
            <Text className="text-slate-500 text-sm mt-0.5">
              Barcode: {product?.barcode || newProduct?.barcode || 'Sin codigo de barras'}
            </Text>
            <Text className="text-slate-500 text-sm mt-0.5">
              SKU: {product?.sku || newProduct?.sku || 'Sin sku'}
            </Text>
          </View>
        </View>
        {newProduct && (
          <View className="flex-1 mt-2">
            <Input
              label="Descripción del manifiesto"
              value={form.description}
              onChangeText={(v) => set('description', v)}
              multiline
              textAlignVertical="top"
            />
            <View className="flex flex-row items-center gap-4 mt-3">
              <Text>Requiere ensamble</Text>
              <Switch value={form.needAssembly} onValueChange={(v) => set('needAssembly', v)} />
            </View>
          </View>
        )}
      </View>

      <View className="flex flex-col bg-slate-50 rounded-2xl p-3 mt-3">
        <View className="flex flex-row gap-4">
          <Boxes size={18} color="#4f46e5" />
          <Text className="text-base font-bold">Inventario y stock</Text>
        </View>
        <View className="flex-row items-center self-start bg-slate-100 rounded-xl mb-4">
          <Pressable
            onPress={() => set('qty', Math.max(1, form.qty - 1))}
            className="w-11 h-11 items-center justify-center active:scale-95"
          >
            <Minus size={18} color="#334155" />
          </Pressable>
          <Text className="w-10 text-center text-lg font-bold text-slate-800">{form.qty}</Text>
          <Pressable
            onPress={() => set('qty', form.qty + 1)}
            className="w-11 h-11 items-center justify-center active:scale-95"
          >
            <Plus size={18} color="#334155" />
          </Pressable>
        </View>

        <Input
          label="Ubicacion en bodega"
          value={form.location}
          onChangeText={(v) => set('location', v)}
          placeholder="Pasillo B - Estante 4 - Tarima 12"
        />

        <Input
          label="Observaciones"
          multiline
          textAlignVertical="top"
          value={form.notes}
          onChangeText={(v) => set('notes', v)}
          placeholder="Caja abierta, le faltan piezas, etc."
          placeholderTextColor="#94a3b8"
        />

        <View className="mt-4">
          <Text className="text-base font-bold mb-4">Fotos de caja o producto</Text>
          <PhotoPicker photos={form.photos} onChange={(p) => set('photos', p)} />
        </View>
      </View>

      <View className="flex-row mt-5">
        <Pressable
          onPress={() => onClose()}
          className="flex-1 bg-slate-100 rounded-xl py-3 mr-2 items-center"
        >
          <Text className="text-slate-700 font-semibold text-sm">Cancelar</Text>
        </Pressable>
        <Pressable
          className={`flex-1 bg-primary-600 rounded-xl py-3 items-center ${saving || (!!newProduct && !form.description.trim()) ? 'opacity-50' : ''}`}
          disabled={saving || (!!newProduct && !form.description.trim())}
          onPress={() => handleSanvig()}
        >
          <Text className="text-sm font-semibold text-white">Guardar</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

export interface IReceiveBoxSheetProps {
  product: IProductLookup | null;
  newProduct?: { barcode: string; sku: string } | null;
  onClose: () => void;
}
