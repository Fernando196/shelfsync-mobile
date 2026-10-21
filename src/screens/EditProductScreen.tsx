import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Tag, Boxes, MapPin, Minus, Plus, Camera, Trash2 } from 'lucide-react-native';
import { useInventory } from '../state/InventoryContext';
import AccordionSection from '../components/ui/AccordionSection';
import { hapticSuccess, hapticError } from '../lib/haptics';
import { IEditForm, IInventoryItem } from '../interfaces/item.interface';
import { deleteItem, getItemById, updateItem } from '../services/items.service';
import { formatItemCode } from '../lib/formatItemCode';
import CategoryAutocomplete from '../components/form/CategoryAutocomplete';
import LocationPickerMap from '../components/form/LocationPickerMap';
import PhotoPicker from '../components/form/PhotoPicker';
import { photoUrl, uploadPhoto } from '../services/files.service';
import { COLORS } from '../const/theme.const';
import { Screen } from '../components/ui/Screen';
import { BackButton } from '../components/ui/BackButton';

function emptyForm(): IEditForm {
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
  const [deleting, setDeleting] = useState(false);
  const { removeItem } = useInventory();

  const handleDelete = () => {
    Alert.alert(
      'Eliminar producto',
      'Esta accion quita el articulo del inventario. No se puede deshacer desde la app.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteItem(id);
              removeItem(id);
              // Editar y Detalle ya no tienen item: volver a la lista.
              navigation.popToTop();
            } catch (e: any) {
              Alert.alert('No se pudo eliminar', e?.message ?? String(e));
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };
  const [item, setItem] = useState<IInventoryItem | null>(null);

  const [form, setForm] = useState<IEditForm>(emptyForm());
  const [newPhotos, setNewPhotos] = useState<string[]>([]);

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
      // Se quitan una por una al subir, asi un reintento no duplica las que ya subieron.
      for (const uri of newPhotos) {
        await uploadPhoto(id, uri);
        setNewPhotos((prev) => prev.filter((p) => p !== uri));
      }
      hapticSuccess();
      navigation.goBack();
    } catch (e: any) {
      hapticError();
      Alert.alert('No se pudo guardar', e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  };

  const onChangeForm = <K extends keyof IEditForm>(key: K, value: IEditForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Screen>
      {/* Encabezado propio (sin header nativo), mismo estilo que Inventario */}
      <View className="flex-row items-center px-5 pb-2">
        <BackButton />
        <Text className="text-2xl font-bold text-slate-800 ml-3">Editar mueble</Text>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 48 }}
      >
        <Text className="text-slate-400 text-sm mb-5">
          Los cambios se guardan directo en el servidor
        </Text>

        <AccordionSection title="Identificacion del mueble" icon={<Tag size={18} color={COLORS.primary} />}>
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
            className="border border-slate-200 rounded-xl px-4 py-3 mb-4 text-base text-slate-800"
            value={form.name}
            onChangeText={(name) => onChangeForm('name', name)}
          />

          <Text className="text-xs font-semibold text-slate-500 mb-2">Categoria</Text>
          <CategoryAutocomplete
            label="Buscar categoria"
            onChange={(id) => onChangeForm('categoryId', id)}
            selected={form.categoryId || ''}
          />
        </AccordionSection>

        <AccordionSection title="Inventario y stock" icon={<Boxes size={18} color={COLORS.primary} />}>
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
            className="border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800"
            value={form.location}
            onChangeText={(location) => onChangeForm('location', location)}
          />
        </AccordionSection>

        <AccordionSection title="Fotos" icon={<Camera size={18} color={COLORS.primary} />}>
          {(item?.files?.length ?? 0) > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
              {item?.files?.map((p) => (
                <Image
                  key={p.id}
                  source={{ uri: photoUrl(p.thumbnailUrl ?? p.url) }}
                  className="w-24 h-24 rounded-xl mr-3"
                />
              ))}
            </ScrollView>
          )}
          <Text className="text-xs font-semibold text-slate-500 mb-2">Agregar fotos</Text>
          <PhotoPicker photos={newPhotos} onChange={setNewPhotos} />
        </AccordionSection>

        <AccordionSection
          title="Geolocalizacion en bodega"
          icon={<MapPin size={18} color={COLORS.primary} />}
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

        {/* Eliminar vive aqui y no en el detalle, para que no se toque por error */}
        <Pressable
          onPress={handleDelete}
          disabled={deleting || saving}
          className="flex-row items-center justify-center py-4 mt-4 active:opacity-70"
        >
          {deleting ? (
            <ActivityIndicator color="#e11d48" />
          ) : (
            <>
              <Trash2 size={16} color="#e11d48" />
              <Text className="text-rose-600 font-semibold ml-2">Eliminar producto</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
