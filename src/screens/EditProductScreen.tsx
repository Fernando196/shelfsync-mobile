import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { id } = route.params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { removeItem } = useInventory();

  const handleDelete = () => {
    Alert.alert(
      t('edit.delete'),
      t('edit.deleteMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteItem(id);
              removeItem(id);
              // Editar y Detalle ya no tienen item: volver a la lista.
              navigation.popToTop();
            } catch (e: any) {
              Alert.alert(t('edit.deleteFailed'), e?.message ?? String(e));
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
      .catch((e) => Alert.alert(t('edit.loadFailed'), e?.message ?? String(e)))
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
      Alert.alert(t('edit.saveFailed'), e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  };

  const onChangeForm = <K extends keyof IEditForm>(key: K, value: IEditForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface dark:bg-slate-950">
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Screen>
      {/* Encabezado propio (sin header nativo), mismo estilo que Inventario */}
      <View className="flex-row items-center px-5 pb-2">
        <BackButton />
        <Text className="text-2xl font-bold text-slate-800 dark:text-slate-100 ml-3">{t('edit.title')}</Text>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 48 }}
      >
        <Text className="text-slate-400 text-sm mb-5">
          {t('edit.subtitle')}
        </Text>

        <AccordionSection title={t('edit.identification')} icon={<Tag size={18} color={COLORS.primary} />}>
          <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            {t('edit.code', { code: item ? formatItemCode(item.code) : '' })}
          </Text>
          <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            {t('edit.sku', { sku: item?.productLookup.sku ?? '' })}
          </Text>
          <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            {t('edit.product', { description: item?.productLookup.description ?? '' })}
          </Text>
          <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{t('edit.name')}</Text>
          <TextInput
            className="border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 mb-4 text-base text-slate-800 dark:text-slate-100"
            value={form.name}
            onChangeText={(name) => onChangeForm('name', name)}
          />

          <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">{t('edit.category')}</Text>
          <CategoryAutocomplete
            label={t('reception.searchCategory')}
            onChange={(id) => onChangeForm('categoryId', id)}
            selected={form.categoryId || ''}
          />
        </AccordionSection>

        <AccordionSection title={t('edit.stock')} icon={<Boxes size={18} color={COLORS.primary} />}>
          <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">{t('edit.available')}</Text>
          <View className="flex-row items-center self-start bg-slate-100 dark:bg-slate-700 rounded-xl mb-4">
            <Pressable
              onPress={() => onChangeForm('qty', Math.max(0, form.qty - 1))}
              className="w-11 h-11 items-center justify-center active:scale-95"
            >
              <Minus size={18} color={COLORS.primary} />
            </Pressable>
            <Text className="w-10 text-center text-lg font-bold text-slate-800 dark:text-slate-100">{form.qty}</Text>
            <Pressable
              onPress={() => onChangeForm('qty', form.qty + 1)}
              className="w-11 h-11 items-center justify-center active:scale-95"
            >
              <Plus size={18} color={COLORS.primary} />
            </Pressable>
          </View>

          <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{t('edit.location')}</Text>
          <TextInput
            className="border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-base text-slate-800 dark:text-slate-100"
            value={form.location}
            onChangeText={(location) => onChangeForm('location', location)}
          />
        </AccordionSection>

        <AccordionSection title={t('edit.photos')} icon={<Camera size={18} color={COLORS.primary} />}>
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
          <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">{t('edit.addPhotos')}</Text>
          <PhotoPicker photos={newPhotos} onChange={setNewPhotos} />
        </AccordionSection>

        <AccordionSection
          title={t('edit.geolocation')}
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
          className={`rounded-xl py-4 items-center mt-2 active:scale-95 ${saving ? 'bg-slate-200 dark:bg-slate-600' : 'bg-primary-600 dark:bg-slate-600'}`}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-base">{t('edit.save')}</Text>
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
              <Text className="text-rose-600 dark:text-rose-400 font-semibold ml-2">{t('edit.delete')}</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
