import React from 'react';
import { View, Text } from 'react-native';

export type PillTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

export const TONE_STYLES: Record<PillTone, { bg: string; dot: string; text: string }> = {
  success: { bg: 'bg-emerald-50 dark:bg-emerald-950', dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300' },
  warning: { bg: 'bg-amber-50 dark:bg-amber-950', dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300' },
  danger: { bg: 'bg-rose-50 dark:bg-rose-950', dot: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-300' },
  info: { bg: 'bg-primary-50 dark:bg-slate-800', dot: 'bg-primary-500', text: 'text-primary-700 dark:text-slate-200' },
  neutral: { bg: 'bg-slate-100 dark:bg-slate-700', dot: 'bg-slate-400', text: 'text-slate-600 dark:text-slate-300' },
};

export default function StatusPill({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: PillTone;
}) {
  const s = TONE_STYLES[tone];
  return (
    <View className={`flex-row items-center self-start px-3 py-1 rounded-full ${s.bg}`}>
      <View className={`w-2 h-2 rounded-full mr-2 ${s.dot}`} />
      <Text className={`text-xs font-semibold ${s.text}`}>{label}</Text>
    </View>
  );
}
