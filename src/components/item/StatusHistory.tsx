import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { EnumItemStatus } from '../../interfaces/enum/itemStatus.type';
import { useEffect, useState } from 'react';
import { IItemStatusHistory } from '../../interfaces/item.interface';
import { getStatusHistory } from '../../services/items.service';
import { hapticError } from '../../lib/haptics';
import { TONE_STYLES } from './StatusPill';
import { ITEM_STATUS } from '../../const/itemStatus.const';

export function StatusHistory({ itemId, status }: StatusHistoryProps) {
  const [history, setHistory] = useState<IItemStatusHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    getStatusHistory(itemId)
      .then((resp) => {
        setHistory(resp.data);
      })
      .catch((err: any) => {
        hapticError();
        Alert.alert('Error al traer el historial', err?.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [itemId, status]);

  if (loading && history.length === 0) return <ActivityIndicator color="#4f46e5" />;
  return (
    <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 mt-4">
      <Text className="text-sm font-semibold text-slate-500 mb-3">Historial</Text>
      {history.length === 0 ? (
        <Text className="text-slate-400 text-sm">Sin movimientos</Text>
      ) : (
        history.map((item, index) => {
          const st = ITEM_STATUS[item.toStatus];
          const dot = TONE_STYLES[st.tone].dot;
          return (
            <View className="flex-row" key={item.id}>
              <View className="w-5 items-center">
                <View className={`w-3 h-3 rounded-full mt-1.5 ${dot}`} />
                {index < history.length - 1 ? (
                  <View className="w-px flex-1 bg-slate-200 mt-1" />
                ) : null}
              </View>
              <View className="flex-1 ml-2 pb-4">
                <View className="flex-row justify-between">
                  <Text className="font-semibold text-slate-800">{st.label}</Text>
                  <Text className="text-xs text-slate-400">
                    {new Date(item.changedAt).toLocaleString('es-MX', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <View className="mt-2">
                  <Text className="text-sm text-slate-500">
                    {item.changedBy?.fullName ?? 'Sin usuario'}
                  </Text>
                  {!!item.comment && (
                    <View className="bg-rose-50 rounded-lg px-3 py-2 mt-2">
                      <Text className="text-rose-700 text-sm">{item.comment}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

export interface StatusHistoryProps {
  itemId: string;
  status: EnumItemStatus;
}
