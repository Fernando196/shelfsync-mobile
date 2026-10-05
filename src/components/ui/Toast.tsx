import { CheckCircle2 } from 'lucide-react-native';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type IToast = { title: string; subtitle?: string };

export function Toast({ toast, children }: { toast: IToast; children?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="absolute left-0 right-0 items-center z-10"
      pointerEvents="none"
      style={{
        top: insets.top + 10,
      }}
    >
      <View className="flex-row items-center bg-emerald-600 rounded-2xl px-4 py-3 mx-4">
        <CheckCircle2 size={22} color="#fff" />
        <View className="ml-3">
          <Text className="text-white font-bold text-lg">{toast.title}</Text>
          {!!toast.subtitle && (
            <Text className="text-white/80 text-base" numberOfLines={1}>
              {toast.subtitle}
            </Text>
          )}
          {children}
        </View>
      </View>
    </View>
  );
}
