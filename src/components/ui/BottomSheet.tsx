import { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomSheetProps {
  title: string;
  children: ReactNode;
}

export function BottomSheet({ title, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      pointerEvents="box-none"
      className="absolute bottom-0 left-0 right-0 justify-end"
      behavior="padding"
      style={{ top: insets.top + 20 }}
    >
      <View className="bg-white rounded-t-3xl p-5 pb-10" style={{ flexShrink: 1 }}>
        <View className="self-center w-10 h-1 rounded-full bg-slate-300 mb-4" />
        <Text className="text-lg font-bold text-slate-800 mb-3">{title}</Text>
        <ScrollView style={{ flexShrink: 1 }} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
