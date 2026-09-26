import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { Package, MapPin } from 'lucide-react-native';
import StatusPill, { PillTone } from './StatusPill';
import { ProductCardData } from '../interfaces/product.interface';

export default function ProductCard({
  item,
  statusLabel,
  statusTone,
  onPress,
}: {
  item: ProductCardData;
  statusLabel?: string;
  statusTone?: PillTone;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row bg-white rounded-2xl p-3 mb-3 border border-slate-200 shadow-sm active:scale-95"
    >
      <View className="w-16 h-16 rounded-xl bg-slate-100 items-center justify-center overflow-hidden mr-3">
        {item.thumbnailUri ? (
          <Image source={{ uri: item.thumbnailUri }} className="w-16 h-16" resizeMode="cover" />
        ) : (
          <Package size={26} color="#94a3b8" />
        )}
      </View>

      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-slate-800 flex-1" numberOfLines={1}>
            {item.name || item.sku}
          </Text>
          {statusLabel ? <StatusPill label={statusLabel} tone={statusTone} /> : null}
        </View>
        <Text className="text-xs text-slate-400 mt-0.5">SKU {item.sku}</Text>

        <View className="flex-row items-center justify-between mt-2">
          <View className="flex-row items-center flex-1">
            <MapPin size={12} color="#94a3b8" />
            <Text className="text-xs text-slate-500 ml-1 flex-1" numberOfLines={1}>
              {item.location || 'Sin ubicacion'}
            </Text>
          </View>
          <View className="bg-indigo-50 rounded-full px-2 py-0.5 ml-2">
            <Text className="text-xs font-semibold text-primary-700">x{item.qty}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
