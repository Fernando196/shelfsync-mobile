import React from "react";
import { View, Text } from "react-native";

export type PillTone = "success" | "warning" | "danger" | "neutral" | "info";

const TONE_STYLES: Record<PillTone, { bg: string; dot: string; text: string }> = {
  success: { bg: "bg-emerald-50", dot: "bg-emerald-500", text: "text-emerald-700" },
  warning: { bg: "bg-amber-50", dot: "bg-amber-500", text: "text-amber-700" },
  danger: { bg: "bg-rose-50", dot: "bg-rose-500", text: "text-rose-700" },
  info: { bg: "bg-indigo-50", dot: "bg-indigo-500", text: "text-indigo-700" },
  neutral: { bg: "bg-slate-100", dot: "bg-slate-400", text: "text-slate-600" },
};

export default function StatusPill({ label, tone = "neutral" }: { label: string; tone?: PillTone }) {
  const s = TONE_STYLES[tone];
  return (
    <View className={`flex-row items-center self-start px-3 py-1 rounded-full ${s.bg}`}>
      <View className={`w-2 h-2 rounded-full mr-2 ${s.dot}`} />
      <Text className={`text-xs font-semibold ${s.text}`}>{label}</Text>
    </View>
  );
}
