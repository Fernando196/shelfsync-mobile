import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CloudUpload, RefreshCw, Trash2, CheckCheck, X } from 'lucide-react-native';
import { listQueue, syncAll, syncEntry, clearSynced, removeEntry } from '../lib/syncQueue';
import StatusPill, { PillTone } from '../components/item/StatusPill';
import { hapticSuccess, hapticTap, hapticSelect } from '../lib/haptics';
import { IQueueEntry } from '../interfaces/queue.interface';

const STATUS_META: Record<IQueueEntry['status'], { label: string; tone: PillTone }> = {
  pending: { label: 'Pendiente', tone: 'warning' },
  syncing: { label: 'Sincronizando', tone: 'info' },
  synced: { label: 'Sincronizado', tone: 'success' },
  error: { label: 'Error', tone: 'danger' },
};

export default function SyncQueueScreen() {
  const [entries, setEntries] = useState<IQueueEntry[]>([]);
  const [syncingAll, setSyncingAll] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setEntries(await listQueue());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const pendingCount = entries.filter((e) => e.status === 'pending' || e.status === 'error').length;

  const handleSyncAll = async () => {
    hapticTap();
    setSyncingAll(true);
    await syncAll();
    await load();
    hapticSuccess();
    setSyncingAll(false);
  };

  const handleRetry = async (localId: string) => {
    setRetryingId(localId);
    await syncEntry(localId);
    await load();
    setRetryingId(null);
  };

  const handleClearSynced = async () => {
    await clearSynced();
    await load();
  };

  const handleRemove = (entry: IQueueEntry) => {
    Alert.alert(
      'Quitar de la cola',
      `"${entry.product.name || entry.product.sku}" se quita de este dispositivo. Esto no borra nada del servidor.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: async () => {
            hapticSelect();
            await removeEntry(entry.localId);
            await load();
          },
        },
      ],
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View className="flex-1 bg-surface">
      <View className="px-5 pt-4 pb-3">
        <Text className="text-2xl font-bold text-slate-800">Sincronizacion</Text>
        <Text className="text-slate-400 text-sm mt-0.5">
          {pendingCount > 0
            ? `${pendingCount} productos pendientes por subir`
            : 'Todo sincronizado'}
        </Text>

        <View className="flex-row mt-4">
          <Pressable
            onPress={handleSyncAll}
            disabled={syncingAll || pendingCount === 0}
            className={`flex-1 flex-row items-center justify-center rounded-xl py-3 mr-2 active:scale-95 ${
              pendingCount === 0 ? 'bg-slate-200' : 'bg-primary-600'
            }`}
          >
            {syncingAll ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <CloudUpload size={16} color={pendingCount === 0 ? '#94a3b8' : '#fff'} />
                <Text
                  className={`font-semibold ml-2 text-sm ${pendingCount === 0 ? 'text-slate-400' : 'text-white'}`}
                >
                  Sincronizar todo
                </Text>
              </>
            )}
          </Pressable>
          <Pressable
            onPress={handleClearSynced}
            className="flex-row items-center justify-center bg-white border border-slate-200 rounded-xl px-4 active:scale-95"
          >
            <Trash2 size={16} color="#64748b" />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(e) => e.localId}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => {
          const meta = STATUS_META[item.status];
          return (
            <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-3">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 mr-2">
                  <Text className="font-semibold text-slate-800" numberOfLines={1}>
                    {item.product.name || item.product.sku}
                  </Text>
                  <Text className="text-xs text-slate-400 mt-0.5">SKU {item.product.sku}</Text>
                </View>
                <View className="flex-row items-center">
                  <StatusPill label={meta.label} tone={meta.tone} />
                  <Pressable
                    onPress={() => handleRemove(item)}
                    hitSlop={8}
                    className="ml-2 w-6 h-6 items-center justify-center rounded-full active:bg-slate-100"
                  >
                    <X size={14} color="#94a3b8" />
                  </Pressable>
                </View>
              </View>

              {item.status === 'error' && item.error && (
                <Text className="text-xs text-rose-500 mt-2">{item.error}</Text>
              )}

              {(item.status === 'pending' || item.status === 'error') && (
                <Pressable
                  onPress={() => handleRetry(item.localId)}
                  disabled={retryingId === item.localId}
                  className="flex-row items-center self-start bg-slate-100 rounded-lg px-3 py-2 mt-3 active:scale-95"
                >
                  {retryingId === item.localId ? (
                    <ActivityIndicator size="small" color="#334155" />
                  ) : (
                    <>
                      <RefreshCw size={13} color="#334155" />
                      <Text className="text-slate-700 text-xs font-medium ml-1.5">
                        Reintentar ahora
                      </Text>
                    </>
                  )}
                </Pressable>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="items-center mt-24">
            <CheckCheck size={40} color="#cbd5e1" />
            <Text className="text-slate-400 mt-3">No hay nada pendiente de sincronizar</Text>
          </View>
        }
      />
    </View>
  );
}
