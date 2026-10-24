import React from 'react';
import { Pressable, Text } from 'react-native';
import { hapticSelect } from '../../lib/haptics';

export default function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        hapticSelect();
        onPress();
      }}
      className={`px-4 py-2 rounded-full mr-2 mb-2 border active:scale-95 ${
        selected ? 'bg-primary-600 dark:bg-slate-600 border-primary-600 dark:border-slate-300' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
      }`}
    >
      <Text className={`text-sm font-medium ${selected ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>
        {label}
      </Text>
    </Pressable>
  );
}
