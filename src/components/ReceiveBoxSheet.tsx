import { Boxes, Minus, Package, Plus } from 'lucide-react-native';
import { View, Text, Pressable, TextInput, KeyboardAvoidingView, Alert } from 'react-native';
import { IReceiveBoxSheetProps } from '../interfaces/components/ReceiveBoxSheetProps.interface';
import { useEffect, useState } from 'react';
import { Input } from './ui/Input';
import { InventoryItem, UpsertItemInput } from '../interfaces/item.interface';
import { generateUuid } from '../lib/uuid';
import { hapticError, hapticSuccess } from '../lib/haptics';
import { createItem } from '../services/items.service';
import * as Location from 'expo-location';
import PhotoPicker from './PhotoPicker';
import { uploadPhoto } from '../services/files.service';

function emptyForm() {
  return {
    qty: 1,
    location: '',
    notes: '',
    latitude: null as number | null,
    longitude: null as number | null,
    photos: [] as string[],
  };
}

export function ReceiveBoxSheet({ product, onClose }: IReceiveBoxSheetProps) {
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
        productLookupId: product.id,
        name: product.description || '',
        qty: form.qty,
        location: form.location,
        notes: form.notes?.trim(),
        longitude: form.longitude || undefined,
        latitude: form.latitude || undefined,
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
    <KeyboardAvoidingView className="absolute bottom-0 left-0 right-0" behavior="padding">
      <View className="bg-white rounded-t-3xl p-5 pb-10">
        <View className="self-center w-10 h-1 rounded-full bg-slate-300 mb-4" />
        <Text className="text-lg font-bold text-slate-800 mb-3">Recibir caja</Text>
        <View className="flex-row items-center bg-slate-50 rounded-2xl p-3">
          <View className="w-12 h-12 rounded-xl bg-slate-200 items-center justify-center mr-3">
            <Package size={22} color="#64748b" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-slate-800" numberOfLines={2}>
              {product?.description || 'Sin descripción'}
            </Text>
            <Text className="text-slate-500 text-sm mt-0.5">SKU: {product?.sku || 'Sin sku'}</Text>
          </View>
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
            className={`flex-1 bg-primary-600 rounded-xl py-3 items-center ${saving ? 'opacity-50' : ''}`}
            disabled={saving}
            onPress={() => handleSanvig()}
          >
            <Text className="text-sm font-semibold text-white">Guardar</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
