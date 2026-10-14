import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Search, PackageSearch, WifiOff } from 'lucide-react-native';
import ProductCard from '../components/reception/ProductCard';
import { PillTone } from '../components/item/StatusPill';
import { IProductCardData } from '../interfaces/product.interface';
import { listItems } from '../services/items.service';
import { photoUrl } from '../services/files.service';
import { formatItemCode } from '../lib/formatItemCode';
import { Screen } from '../components/ui/Screen';
import { getItemStatus } from '../lib/statusItem';
import { useInventory } from '../state/InventoryContext';

type Row = {
  key: string;
  card: IProductCardData;
  statusLabel?: string;
  statusTone?: PillTone;
  onPress?: () => void;
};

const PAGE_SIZE = 20;

export default function InventoryScreen() {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const { items, setItems } = useInventory();
  const [total, setTotal] = useState<number>(0);
  const [offline, setOffline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [debounceQuery, setDebounceQuery] = useState<string>('');
  const requestId = useRef(0);

  useEffect(() => {
    const time = setTimeout(() => {
      setDebounceQuery(query);
    }, 300);

    return () => {
      clearTimeout(time);
    };
  }, [query]);

  const loadFirst = useCallback(async (q: string) => {
    try {
      const id = ++requestId.current;
      const { data, count } = await listItems(q, 0, PAGE_SIZE);
      if (id !== requestId.current) return;
      setItems(data);
      setTotal(count);
      setOffline(false);
    } catch (err: any) {
      setOffline(true);
    }
  }, []);

  const loadMore = async () => {
    const id = requestId.current;
    if (loadingMore || items.length >= total) return;
    try {
      setLoadingMore(true);
      const { data, count } = await listItems(debounceQuery, items.length, PAGE_SIZE);
      if (id !== requestId.current) return;
      setItems((prev) => {
        const seen = new Set(prev.map((i) => i.id));
        const fresh = data.filter((i) => !seen.has(i.id));
        return [...prev, ...fresh];
      });
      setTotal(count);
    } catch (err) {
      setOffline(true);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadFirst(debounceQuery);
  }, [loadFirst, debounceQuery]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadFirst(debounceQuery);
    } catch (err: any) {
    } finally {
      setRefreshing(false);
    }
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
        thumbnailUri: item.cover ? photoUrl(item.cover.thumbnailUrl ?? item.cover.url) : undefined,
        code: formatItemCode(item.code),
      },
      onPress: () => navigation.navigate('ItemDetail', { id: item.id }),
      statusLabel: status.label,
      statusTone: status.tone,
    };
  });

  return (
    <Screen>
      <View className="px-5 pb-2">
        <Text className="text-2xl font-bold text-slate-800">Inventario</Text>
        <Text className="text-slate-400 text-sm mt-0.5">{total} articulos</Text>

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
              Sin conexion con el servidor. Desliza hacia abajo para reintentar.
            </Text>
          </View>
        )}
      </View>

      <FlatList
        data={backendRows}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
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
        ListFooterComponent={loadingMore ? <ActivityIndicator className="pt-4 pb-10" /> : null}
      />
    </Screen>
  );
}
