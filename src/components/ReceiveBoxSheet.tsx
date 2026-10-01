import { Package } from 'lucide-react-native';
import { View, Text, Pressable } from 'react-native';
import { IReceiveBoxSheetProps } from '../interfaces/components/ReceiveBoxSheetProps.interface';
export function ReceiveBoxSheet({ product, onClose }: IReceiveBoxSheetProps) {
  return (
    <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-5 pb-10">
      <View className="self-center w-10 h-1 rounded-full bg-slate-300 mb-4" />
      <Text className="text-lg font-bold text-slate-800 mb-3">Recibir caja</Text>
      <View className="flex-row items-center bg-slate-50 rounded-2xl p-3">
        <View className="w-12 h-12 rounded-xl bg-slate-200 items-center justify-center mr-3">
          <Package size={22} color="#64748b" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-slate-800" numberOfLines={2}>
            {product?.description || 'Sin descripción'}
          </Text>
          <Text className="text-slate-500 text-sm mt-0.5">SKU: {product?.sku || 'Sin sku'}</Text>
        </View>
      </View>

      <View className="flex-row mt-5">
        <Pressable
          onPress={() => onClose()}
          className="flex-1 bg-slate-100 rounded-xl py-3 mr-2 items-center"
        >
          <Text className="text-slate-700 font-semibold text-sm">Cancelar</Text>
        </Pressable>
        <Pressable className="flex-1 bg-primary-600 rounded-xl py-3 items-center" disabled={true}>
          <Text className="text-sm font-semibold text-white">Guardar</Text>
        </Pressable>
      </View>
    </View>
  );
}
