import React, { useCallback, useState } from "react";
import { View, Text, Image, ScrollView, ActivityIndicator, Pressable, Alert } from "react-native";
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";
import { MapPin, Boxes, Tag, Printer, TriangleAlert, Pencil, Trash2 } from "lucide-react-native";
import { getItemById, deleteItem, photoUrl, InventoryItem } from "../api/client";
import ThermalPreviewModal from "../components/ThermalPreviewModal";

export default function ItemDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { id } = route.params;
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPrint, setShowPrint] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    getItemById(id)
      .then((i) => {
        setItem(i);
        setError(null);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleDelete = () => {
    Alert.alert("Eliminar producto", "Esta accion quita el articulo del inventario. No se puede deshacer desde la app.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteItem(id);
            navigation.goBack();
          } catch (e: any) {
            Alert.alert("No se pudo eliminar", e?.message ?? String(e));
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-surface px-8">
        <TriangleAlert size={32} color="#f43f5e" />
        <Text className="text-slate-600 text-center mt-3">{error}</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator color="#4f46e5" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1 mb-4">
          {item.photos.length === 0 ? (
            <View className="w-full h-48 bg-slate-100 rounded-2xl items-center justify-center mx-1">
              <Text className="text-slate-400">Sin fotos</Text>
            </View>
          ) : (
            item.photos.map((p) => (
              <Image
                key={p.id}
                source={{ uri: photoUrl(p.url) }}
                className="rounded-2xl mx-1"
                style={{ width: 260, height: 200 }}
              />
            ))
          )}
        </ScrollView>

        <View className="flex-row items-start justify-between">
          <View className="flex-1 mr-3">
            <Text className="text-2xl font-bold text-slate-800">{item.name || item.sku}</Text>
            <Text className="text-slate-400 text-sm mb-4">SKU {item.sku}</Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate("EditProduct", { id: item.id })}
            className="w-10 h-10 rounded-full bg-indigo-50 items-center justify-center active:scale-95"
          >
            <Pencil size={17} color="#4f46e5" />
          </Pressable>
        </View>

        <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
          <View className="flex-row items-center py-2">
            <Boxes size={16} color="#64748b" />
            <Text className="text-slate-500 ml-2 flex-1">Cantidad</Text>
            <Text className="font-semibold text-slate-800">{item.qty}</Text>
          </View>
          <View className="h-px bg-slate-100" />
          <View className="flex-row items-center py-2">
            <MapPin size={16} color="#64748b" />
            <Text className="text-slate-500 ml-2 flex-1">Ubicacion</Text>
            <Text className="font-semibold text-slate-800">{item.location || "-"}</Text>
          </View>
          <View className="h-px bg-slate-100" />
          <View className="flex-row items-center py-2">
            <Tag size={16} color="#64748b" />
            <Text className="text-slate-500 ml-2 flex-1">Categoria</Text>
            <Text className="font-semibold text-slate-800">{item.category || "-"}</Text>
          </View>
        </View>

        <Pressable
          onPress={() => setShowPrint(true)}
          className="flex-row items-center justify-center bg-primary-600 rounded-xl py-4 active:scale-95 mb-3"
        >
          <Printer size={18} color="#fff" />
          <Text className="text-white font-semibold ml-2">Reimprimir etiqueta</Text>
        </Pressable>

        <Pressable
          onPress={handleDelete}
          disabled={deleting}
          className="flex-row items-center justify-center bg-rose-50 rounded-xl py-4 active:scale-95"
        >
          {deleting ? (
            <ActivityIndicator color="#f43f5e" />
          ) : (
            <>
              <Trash2 size={18} color="#f43f5e" />
              <Text className="text-rose-600 font-semibold ml-2">Eliminar producto</Text>
            </>
          )}
        </Pressable>
      </ScrollView>

      <ThermalPreviewModal
        visible={showPrint}
        onClose={() => setShowPrint(false)}
        product={{ sku: item.sku, name: item.name, qty: item.qty, location: item.location }}
        onGoToPrinterSetup={() => {
          setShowPrint(false);
          navigation.navigate("Settings");
        }}
      />
    </View>
  );
}
