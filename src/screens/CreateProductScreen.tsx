import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Images,
  Tag,
  Boxes,
  MapPin,
  CheckCircle2,
  Minus,
  Plus,
  Printer,
  RotateCcw,
} from 'lucide-react-native';
import AccordionSection from '../components/AccordionSection';
import PhotoPicker from '../components/PhotoPicker';
import Chip from '../components/Chip';
import LocationPickerMap from '../components/LocationPickerMap';
import ThermalPreviewModal from '../components/ThermalPreviewModal';
import { generateUuid } from '../lib/uuid';
import { enqueueProduct, syncEntry } from '../lib/syncQueue';
import { hapticSuccess, hapticTap } from '../lib/haptics';
import { ICategory } from '../interfaces/category.interface';
import { getCategories } from '../lib/categoryCatalog';
import CategoryAutocomplete from '../components/CategoryAutocomplete';

function emptyForm() {
  return {
    localId: generateUuid(),
    sku: '',
    name: '',
    categoryId: null as string | null,
    qty: 1,
    location: '',
    photos: [] as string[],
    latitude: null as number | null,
    longitude: null as number | null,
  };
}

export default function CreateProductScreen() {
  const navigation = useNavigation<any>();
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<null | 'synced' | 'queued'>(null);
  const [showPrint, setShowPrint] = useState(false);

  const set = <K extends keyof ReturnType<typeof emptyForm>>(
    key: K,
    value: ReturnType<typeof emptyForm>[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!form.sku.trim()) {
      set('sku', form.sku);
      return;
    }
    if (saving) return; // evita doble disparo si el tap llega antes de que "disabled" surta efecto
    hapticTap();
    setSaving(true);
    try {
      await enqueueProduct({
        localId: form.localId,
        sku: form.sku.trim(),
        name: form.name.trim(),
        qty: form.qty,
        location: form.location.trim(),
        photoUris: form.photos,
        latitude: form.latitude ?? undefined,
        longitude: form.longitude ?? undefined,
        categoryId: form.categoryId ?? undefined,
      });
      // syncEntry nunca lanza (atrapa sus propios errores y devuelve false),
      // asi que si algo revienta aqui es al guardar localmente - eso si hay
      // que mostrarlo, no dejarlo como rechazo silencioso.
      const synced = await syncEntry(form.localId);
      hapticSuccess();
      setSaved(synced ? 'synced' : 'queued');
    } catch (e: any) {
      Alert.alert('No se pudo guardar', e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm());
    setSaved(null);
  };

  const canSave = form.sku.trim().length > 0;

  return (
    <View className="flex-1 bg-surface">
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-2xl font-bold text-slate-800 mb-1">Registrar mueble</Text>
        <Text className="text-slate-400 text-sm mb-5">
          Se guarda localmente y se sincroniza en automatico
        </Text>

        {saved && (
          <View className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4">
            <View className="flex-row items-center mb-3">
              <CheckCircle2 size={20} color="#10b981" />
              <Text className="text-emerald-700 font-semibold ml-2">
                {saved === 'synced'
                  ? 'Producto guardado y sincronizado'
                  : 'Producto guardado localmente'}
              </Text>
            </View>
            {saved === 'queued' && (
              <Text className="text-emerald-700 text-xs mb-3">
                Se subira al servidor automaticamente cuando haya conexion. Puedes revisarlo en la
                pestana Sincronizar.
              </Text>
            )}
            <View className="flex-row">
              <Pressable
                onPress={() => setShowPrint(true)}
                className="flex-row items-center bg-primary-600 rounded-xl px-4 py-2.5 mr-2 active:scale-95"
              >
                <Printer size={16} color="#fff" />
                <Text className="text-white font-semibold ml-2 text-sm">Imprimir etiqueta QR</Text>
              </Pressable>
              <Pressable
                onPress={resetForm}
                className="flex-row items-center bg-white border border-emerald-200 rounded-xl px-4 py-2.5 active:scale-95"
              >
                <RotateCcw size={16} color="#10b981" />
                <Text className="text-emerald-700 font-semibold ml-2 text-sm">Registrar otro</Text>
              </Pressable>
            </View>
          </View>
        )}

        <AccordionSection title="Galeria multimedia" icon={<Images size={18} color="#4f46e5" />}>
          <PhotoPicker photos={form.photos} onChange={(p) => set('photos', p)} />
        </AccordionSection>

        <AccordionSection
          title="Identificacion del mueble"
          icon={<Tag size={18} color="#4f46e5" />}
        >
          <Text className="text-xs font-semibold text-slate-500 mb-1">SKU / codigo *</Text>
          <TextInput
            className={`border rounded-xl px-4 py-3 mb-4 text-base ${
              !canSave ? 'border-rose-300' : 'border-slate-200'
            }`}
            value={form.sku}
            onChangeText={(v) => set('sku', v)}
            placeholder="MSA-COM-006"
            autoCapitalize="characters"
          />

          <Text className="text-xs font-semibold text-slate-500 mb-1">Nombre del mueble</Text>
          <TextInput
            className="border border-slate-200 rounded-xl px-4 py-3 mb-4 text-base"
            value={form.name}
            onChangeText={(v) => set('name', v)}
            placeholder="Mesa de comedor Parota 6 sillas"
          />

          <Text className="text-xs font-semibold text-slate-500 mb-2">Categoria</Text>
          <View className="flex-row flex-wrap">
            <CategoryAutocomplete
              label="Buscar categoria"
              onChange={(id) => set('categoryId', id)}
              selected={form.categoryId || ''}
            />
          </View>
        </AccordionSection>

        <AccordionSection title="Inventario y stock" icon={<Boxes size={18} color="#4f46e5" />}>
          <Text className="text-xs font-semibold text-slate-500 mb-2">Cantidad disponible</Text>
          <View className="flex-row items-center self-start bg-slate-100 rounded-xl mb-4">
            <Pressable
              onPress={() => set('qty', Math.max(0, form.qty - 1))}
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

          <Text className="text-xs font-semibold text-slate-500 mb-1">Ubicacion en bodega</Text>
          <TextInput
            className="border border-slate-200 rounded-xl px-4 py-3 text-base"
            value={form.location}
            onChangeText={(v) => set('location', v)}
            placeholder="Pasillo B - Estante 4 - Tarima 12"
          />
        </AccordionSection>

        <AccordionSection
          title="Geolocalizacion en bodega"
          icon={<MapPin size={18} color="#4f46e5" />}
        >
          <LocationPickerMap
            latitude={form.latitude}
            longitude={form.longitude}
            onLocationChange={(c) => {
              set('latitude', c.latitude);
              set('longitude', c.longitude);
            }}
          />
        </AccordionSection>

        <Pressable
          onPress={handleSave}
          disabled={!canSave || saving}
          className={`rounded-xl py-4 items-center mt-2 active:scale-95 ${
            !canSave || saving ? 'bg-slate-200' : 'bg-primary-600'
          }`}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text
              className={`font-semibold text-base ${!canSave ? 'text-slate-400' : 'text-white'}`}
            >
              Guardar producto
            </Text>
          )}
        </Pressable>
        {!canSave && (
          <Text className="text-xs text-rose-500 mt-2 text-center">El SKU es obligatorio</Text>
        )}
      </ScrollView>

      <ThermalPreviewModal
        visible={showPrint}
        onClose={() => setShowPrint(false)}
        product={{ id: '', sku: form.sku, name: form.name, qty: form.qty, location: form.location }}
        onGoToPrinterSetup={() => {
          setShowPrint(false);
          navigation.navigate('Settings');
        }}
      />
    </View>
  );
}
