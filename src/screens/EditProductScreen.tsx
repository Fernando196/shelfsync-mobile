import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  ReturnKeyType,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Tag, Boxes, MapPin, Minus, Plus } from 'lucide-react-native';
import AccordionSection from '../components/AccordionSection';
import LocationPickerMap from '../components/LocationPickerMap';
import { hapticSuccess, hapticError } from '../lib/haptics';
import { EditForm, InventoryItem } from '../interfaces/item.interface';
import { getItemById, updateItem } from '../services/items.service';
import CategoryAutocomplete from '../components/CategoryAutocomplete';
import { formatItemCode } from '../lib/formatItemCode';

function emptyForm(): EditForm {
  return {
    name: '',
    qty: 1,
    location: '',
    latitude: null,
    longitude: null,
    categoryId: null,
  };
}

export default function EditProductScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { id } = route.params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [item, setItem] = useState<InventoryItem | null>(null);

  const [form, setForm] = useState<EditForm>(emptyForm());

  useEffect(() => {
    getItemById(id)
      .then((itemResponse) => {
        setForm({
          latitude: itemResponse.latitude ?? null,
          longitude: itemResponse.longitude ?? null,
          location: itemResponse.location || '',
          name: itemResponse.name || '',
          qty: itemResponse.qty ?? 0,
          categoryId: itemResponse.categoryId ?? null,
        });
        setItem(itemResponse);
      })
      .catch((e) => Alert.alert('No se pudo cargar', e?.message ?? String(e)))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateItem(id, {
        name: form.name.trim() || '',
        qty: form.qty,
        location: form.location.trim() || '',
        latitude: form.latitude ?? undefined,
        longitude: form.longitude ?? undefined,
        categoryId: form.categoryId ?? undefined,
      });
      hapticSuccess();
      navigation.goBack();
    } catch (e: any) {
      hapticError();
      Alert.alert('No se pudo guardar', e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  };

  const onChangeForm = <K extends keyof EditForm>(key: K, value: EditForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator color="#4f46e5" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
    >
      <Text className="text-2xl font-bold text-slate-800 mb-1">Editar mueble</Text>
      <Text className="text-slate-400 text-sm mb-5">
        Los cambios se guardan directo en el servidor
      </Text>

      <AccordionSection title="Identificacion del mueble" icon={<Tag size={18} color="#4f46e5" />}>
        <Text className="text-xs font-semibold text-slate-500 mb-1">
          Codigo: {item && formatItemCode(item.code)}
        </Text>
        <Text className="text-xs font-semibold text-slate-500 mb-1">
          SKU / codigo {item?.productLookup.sku}
        </Text>
        <Text className="text-xs font-semibold text-slate-500 mb-1">
          Producto {item?.productLookup.description}
        </Text>
        <Text className="text-xs font-semibold text-slate-500 mb-1">Nombre del mueble</Text>
        <TextInput
          className="border border-slate-200 rounded-xl px-4 py-3 mb-4 text-base"
          value={form.name}
          onChangeText={(name) => onChangeForm('name', name)}
        />

        <Text className="text-xs font-semibold text-slate-500 mb-2">Categoria</Text>
        <View className="flex-row flex-wrap">
          <CategoryAutocomplete
            label="Buscar categoria"
            onChange={(id) => onChangeForm('categoryId', id)}
            selected={form.categoryId || ''}
          />
        </View>
      </AccordionSection>

      <AccordionSection title="Inventario y stock" icon={<Boxes size={18} color="#4f46e5" />}>
        <Text className="text-xs font-semibold text-slate-500 mb-2">Cantidad disponible</Text>
        <View className="flex-row items-center self-start bg-slate-100 rounded-xl mb-4">
          <Pressable
            onPress={() => onChangeForm('qty', Math.max(0, form.qty - 1))}
            className="w-11 h-11 items-center justify-center active:scale-95"
          >
            <Minus size={18} color="#334155" />
          </Pressable>
          <Text className="w-10 text-center text-lg font-bold text-slate-800">{form.qty}</Text>
          <Pressable
            onPress={() => onChangeForm('qty', form.qty + 1)}
            className="w-11 h-11 items-center justify-center active:scale-95"
          >
            <Plus size={18} color="#334155" />
          </Pressable>
        </View>

        <Text className="text-xs font-semibold text-slate-500 mb-1">Ubicacion en bodega</Text>
        <TextInput
          className="border border-slate-200 rounded-xl px-4 py-3 text-base"
          value={form.location}
          onChangeText={(location) => onChangeForm('location', location)}
        />
      </AccordionSection>

      <AccordionSection
        title="Geolocalizacion en bodega"
        icon={<MapPin size={18} color="#4f46e5" />}
        defaultOpen={false}
      >
        <LocationPickerMap
          latitude={form.latitude}
          longitude={form.longitude}
          onLocationChange={(c) => {
            onChangeForm('latitude', c.latitude);
            onChangeForm('longitude', c.longitude);
          }}
        />
      </AccordionSection>

      <Pressable
        onPress={handleSave}
        disabled={saving}
        className={`rounded-xl py-4 items-center mt-2 active:scale-95 ${saving ? 'bg-slate-200' : 'bg-primary-600'}`}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-semibold text-base">Guardar cambios</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}
