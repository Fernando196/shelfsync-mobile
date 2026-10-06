import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, FlatList, RefreshControl, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Search, PackageSearch, WifiOff } from 'lucide-react-native';
import { listQueue } from '../lib/syncQueue';
import ProductCard from '../components/reception/ProductCard';
import { PillTone } from '../components/item/StatusPill';
import { InventoryItem } from '../interfaces/item.interface';
import { QueueEntry } from '../interfaces/queue.interface';
import { ProductCardData } from '../interfaces/product.interface';
import { listItems } from '../services/items.service';
import { photoUrl } from '../services/files.service';
import { formatItemCode } from '../lib/formatItemCode';
import { Screen } from '../components/ui/Screen';
import { getItemStatus } from '../lib/statusItem';

type Row = {
  key: string;
  card: ProductCardData;
  statusLabel?: string;
  statusTone?: PillTone;
  onPress?: () => void;
};

export default function InventoryScreen() {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [offline, setOffline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (q: string) => {
    const [queueEntries, backendItems] = await Promise.all([
      listQueue(),
      listItems(q || undefined).catch(() => null),
    ]);
    setQueue(queueEntries);
    if (backendItems === null) {
      setOffline(true);
    } else {
      setOffline(false);
      setItems(backendItems);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(query);
    }, [load, query]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load(query);
    setRefreshing(false);
  };

  const backendRows: Row[] = items.map((item) => {
    const status = getItemStatus(item);
    return {
      key: `remote-${item.id}`,
      card: {
        name: item.name || '',
        qty: item.qty,
        location: item.location || '',
        category: item.category?.name,
        thumbnailUri: item?.files?.length ? photoUrl(item.files[0].url) : undefined,
        code: formatItemCode(item.code),
      },
      onPress: () => navigation.navigate('ItemDetail', { id: item.id }),
      statusLabel: status.label,
      statusTone: status.tone,
    };
  });

  const pendingRows: Row[] = queue
    .filter((e) => e.status !== 'synced')
    .filter(
      (e) =>
        !query ||
        e.product.sku.toLowerCase().includes(query.toLowerCase()) ||
        e.product.name.toLowerCase().includes(query.toLowerCase()),
    )
    .map((entry) => {
      const toneByStatus: Record<string, { label: string; tone: PillTone }> = {
        pending: { label: 'Pendiente', tone: 'warning' },
        syncing: { label: 'Sincronizando', tone: 'info' },
        error: { label: 'Error de sync', tone: 'danger' },
      };
      const status = toneByStatus[entry.status] ?? toneByStatus.pending;
      return {
        key: `local-${entry.localId}`,
        card: {
          sku: entry.product.sku,
          name: entry.product.name,
          qty: entry.product.qty,
          location: entry.product.location,
          thumbnailUri: entry.product.photoUris[0],
        },
        statusLabel: status.label,
        statusTone: status.tone,
        onPress: () =>
          Alert.alert(
            'Aun no sincronizado',
            entry.status === 'error'
              ? (entry.error ?? 'Hubo un error al sincronizar este producto.')
              : 'Este producto se guardo localmente y se subira cuando haya conexion. Puedes reintentar desde la pestana Sincronizar.',
          ),
      };
    });

  const rows = [...pendingRows, ...backendRows];

  return (
    <Screen>
      <View className="px-5 pb-2">
        <Text className="text-2xl font-bold text-slate-800">Inventario</Text>
        <Text className="text-slate-400 text-sm mt-0.5">{rows.length} articulos</Text>

        <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-3 mt-4">
          <Search size={16} color="#94a3b8" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar por nombre, SKU o ubicacion"
            className="flex-1 py-3 px-2 text-sm"
            placeholderTextColor="#94a3b8"
          />
        </View>

        {offline && (
          <View className="flex-row items-center bg-amber-50 rounded-xl px-3 py-2 mt-3">
            <WifiOff size={14} color="#f59e0b" />
            <Text className="text-amber-700 text-xs ml-2">
              Sin conexion con el servidor: mostrando solo lo guardado localmente
            </Text>
          </View>
        )}
      </View>

      <FlatList
        data={rows}
        keyExtractor={(r) => r.key}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <ProductCard
            item={item.card}
            statusLabel={item.statusLabel}
            statusTone={item.statusTone}
            onPress={item.onPress}
          />
        )}
        ListEmptyComponent={
          <View className="items-center mt-24">
            <PackageSearch size={40} color="#cbd5e1" />
            <Text className="text-slate-400 mt-3">No hay articulos que coincidan</Text>
          </View>
        }
      />
    </Screen>
  );
}
