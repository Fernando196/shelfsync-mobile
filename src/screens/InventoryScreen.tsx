import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Platform,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Search, PackageSearch, RefreshCw, WifiOff, X } from 'lucide-react-native';
import { PULL_REFRESHING, useWebPullToRefresh } from '../hooks/useWebPullToRefresh';
import ProductCard from '../components/reception/ProductCard';
import { PillTone } from '../components/item/StatusPill';
import { IProductCardData } from '../interfaces/product.interface';
import { getStatusCounts, listItems } from '../services/items.service';
import { StatusFilterChips } from '../components/item/StatusFilterChips';
import { InventorySkeleton } from '../components/item/InventorySkeleton';
import { EnumItemStatus } from '../interfaces/enum/itemStatus.type';
import { IItemStatusCounts } from '../interfaces/item.interface';
import { photoUrl } from '../services/files.service';
import { formatItemCode } from '../lib/formatItemCode';
import { Screen } from '../components/ui/Screen';
import { getItemStatus } from '../lib/statusItem';
import { useInventory } from '../state/InventoryContext';
import { COLORS } from '../const/theme.const';
import { useTranslation } from 'react-i18next';

type Row = {
  key: string;
  card: IProductCardData;
  statusLabel?: string;
  statusTone?: PillTone;
  onPress?: () => void;
};

const PAGE_SIZE = 20;

export default function InventoryScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [skeleton, setSkeleton] = useState(true);
  const [status, setStatus] = useState<EnumItemStatus | null>(null);
  const [counts, setCounts] = useState<IItemStatusCounts | null>(null);
  const { items, setItems, total, setTotal } = useInventory();
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

  // Devuelve false si una carga mas nueva la reemplazo (para no apagar su skeleton).
  const loadFirst = useCallback(async (q: string, s: EnumItemStatus | null) => {
    const id = ++requestId.current;
    try {
      const { data, count } = await listItems(q, 0, PAGE_SIZE, s);
      if (id !== requestId.current) return false;
      setItems(data);
      setTotal(count);
      setOffline(false);
    } catch (err: any) {
      if (id !== requestId.current) return false;
      setOffline(true);
    }
    return true;
  }, []);

  const loadMore = async () => {
    const id = requestId.current;
    // Durante el skeleton `items` aun es del filtro anterior: no paginar con ese offset.
    if (skeleton || loadingMore || items.length >= total) return;
    try {
      setLoadingMore(true);
      const { data, count } = await listItems(debounceQuery, items.length, PAGE_SIZE, status);
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

  // Al abrir, cambiar de estatus o buscar: skeleton en vez de la lista anterior (que ya no
  // corresponde al filtro). El pull-to-refresh no lo usa: ahi se queda la lista con su spinner.
  useEffect(() => {
    setSkeleton(true);
    loadFirst(debounceQuery, status).then((latest) => {
      if (latest) setSkeleton(false);
    });
  }, [loadFirst, debounceQuery, status]);

  const loadCounts = useCallback(() => {
    getStatusCounts(debounceQuery)
      .then(setCounts)
      .catch(() => {});
  }, [debounceQuery]);

  // Recarga suave: trae la primera pagina, agrega arriba lo nuevo y actualiza lo que ya
  // estaba, sin tirar lo cargado mas abajo ni mover el scroll.
  const softRefresh = useCallback(async () => {
    const id = requestId.current;
    try {
      const { data, count } = await listItems(debounceQuery, 0, PAGE_SIZE, status);
      if (id !== requestId.current) return;
      setItems((prev) => {
        if (!prev.length) return data;
        const fresh = new Map(data.map((i) => [i.id, i]));
        const known = new Set(prev.map((i) => i.id));
        // Solo es nuevo lo que viene ANTES del primer item ya cargado. Lo desconocido
        // que aparece despues es un item viejo que se recorrio (p. ej. tras borrar uno);
        // ese llega en su lugar con la siguiente pagina.
        const firstKnown = data.findIndex((i) => known.has(i.id));
        const added = firstKnown === -1 ? [] : data.slice(0, firstKnown);
        return [...added, ...prev.map((i) => fresh.get(i.id) ?? i)];
      });
      setTotal(count);
      setOffline(false);
      loadCounts();
    } catch {
      setOffline(true);
    }
  }, [debounceQuery, status, loadCounts]);

  // Al volver a la lista (detalle, escaner) se trae lo nuevo sin perder el scroll.
  useFocusEffect(
    useCallback(() => {
      softRefresh();
    }, [softRefresh]),
  );

  // Cerrar el buscador tambien quita el filtro de texto.
  const closeSearch = () => {
    setQuery('');
    setSearchOpen(false);
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      loadCounts();
      await loadFirst(debounceQuery, status);
    } catch (err: any) {
    } finally {
      setRefreshing(false);
    }
  };

  const listRef = useRef<FlatList<Row>>(null);
  const pullIndicatorRef = useRef<View>(null);
  const pullIconRef = useRef<View>(null);
  const webPull = useWebPullToRefresh(listRef, pullIndicatorRef, pullIconRef, onRefresh);

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
        price: item.price,
      },
      onPress: () => navigation.navigate('ItemDetail', { id: item.id }),
      statusLabel: status.label,
      statusTone: status.tone,
    };
  });

  return (
    <Screen>
      <View className="px-5 pb-2">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('inventory.title')}</Text>
            <Text className="text-slate-400 text-sm mt-0.5">
              {t('inventory.count', { count: total })}
            </Text>
          </View>
          <View className="flex-row">
            {!searchOpen && (
              <Pressable
                onPress={() => setSearchOpen(true)}
                hitSlop={8}
                className="w-11 h-11 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 items-center justify-center active:opacity-70"
              >
                <Search size={20} color={COLORS.primary} />
              </Pressable>
            )}
          </View>
        </View>

        {searchOpen && (
          // El foco se marca en el contenedor (que es el que tiene el borde), no en el input.
          <View
            className={`flex-row items-center bg-white dark:bg-slate-900 border rounded-xl px-3 mt-4 ${
              searchFocused ? 'border-primary-600 dark:border-slate-300' : 'border-slate-200 dark:border-slate-700'
            }`}
          >
            <Search size={16} color={searchFocused ? COLORS.primary : '#94a3b8'} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('inventory.searchPlaceholder')}
              className="flex-1 py-3 px-2 text-sm text-slate-800 dark:text-slate-100"
              placeholderTextColor="#94a3b8"
              autoFocus
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            <Pressable onPress={closeSearch} hitSlop={8} className="p-1 active:opacity-70">
              <X size={18} color="#94a3b8" />
            </Pressable>
          </View>
        )}

        <StatusFilterChips selected={status} counts={counts} onChange={setStatus} />

        {offline && (
          <View className="flex-row items-center bg-amber-50 dark:bg-amber-950 rounded-xl px-3 py-2 mt-3">
            <WifiOff size={14} color="#f59e0b" />
            <Text className="text-amber-700 dark:text-amber-300 text-xs ml-2">
              {Platform.OS === 'web'
                ? t('inventory.offlinePull')
                : t('inventory.offlineSwipe')}
            </Text>
          </View>
        )}
      </View>

      <View style={{ flex: 1, overflow: 'hidden' }}>
        {/* Indicador del "jalar para actualizar" de web, detras de la lista: se descubre
            al jalar. En nativo no se usa (lo pinta RefreshControl). */}
        {Platform.OS === 'web' && (
          <View
            ref={pullIndicatorRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: PULL_REFRESHING,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0,
            }}
          >
            {webPull.refreshing ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <View ref={pullIconRef}>
                <RefreshCw size={22} color={COLORS.primary} />
              </View>
            )}
          </View>
        )}

        <FlatList
          ref={listRef}
          data={skeleton ? [] : backendRows}
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
            skeleton ? (
              <InventorySkeleton />
            ) : (
              <View className="items-center mt-24">
                <PackageSearch size={40} color="#cbd5e1" />
                <Text className="text-slate-400 mt-3">{t('inventory.empty')}</Text>
              </View>
            )
          }
          ListFooterComponent={loadingMore ? <ActivityIndicator className="pt-4 pb-10" /> : null}
        />
      </View>
    </Screen>
  );
}
