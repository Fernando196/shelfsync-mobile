import React, { useState } from "react";
import { View, Text, Pressable, LayoutAnimation, Platform, UIManager } from "react-native";
import { ChevronDown } from "lucide-react-native";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AccordionSection({
  title,
  icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((o) => !o);
  };

  return (
    <View className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-4 overflow-hidden">
      <Pressable onPress={toggle} className="flex-row items-center justify-between px-4 py-4 active:bg-slate-50">
        <View className="flex-row items-center">
          {icon}
          <Text className="text-base font-semibold text-slate-800 ml-2">{title}</Text>
        </View>
        <View style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}>
          <ChevronDown size={18} color="#64748b" />
        </View>
      </Pressable>
      {open && <View className="px-4 pb-4">{children}</View>}
    </View>
  );
}
