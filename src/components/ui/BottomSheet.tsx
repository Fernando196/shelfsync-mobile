import { ReactNode } from 'react';
import { KeyboardAvoidingView, Text, View } from 'react-native';

interface BottomSheetProps {
  title: string;
  children: ReactNode;
}

export function BottomSheet({ title, children }: BottomSheetProps) {
  return (
    <KeyboardAvoidingView className="absolute bottom-0 left-0 right-0" behavior="padding">
      <View className="bg-white rounded-t-3xl p-5 pb-10">
        <View className="self-center w-10 h-1 rounded-full bg-slate-300 mb-4" />
        <Text className="text-lg font-bold text-slate-800 mb-3">{title}</Text>
        {children}
      </View>
    </KeyboardAvoidingView>
  );
}
