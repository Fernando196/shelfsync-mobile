import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated } from "react-native";
import { Delete } from "lucide-react-native";
import { hapticTap, hapticSelect } from "../lib/haptics";

interface PinKeypadProps {
  value: string;
  length?: number;
  onChange: (next: string) => void;
  error?: boolean;
  disabled?: boolean;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

export default function PinKeypad({ value, length = 6, onChange, error, disabled }: PinKeypadProps) {
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!error) return;
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [error, shake]);

  const translateX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] });

  const press = (key: string) => {
    if (disabled) return;
    if (key === "del") {
      hapticSelect();
      onChange(value.slice(0, -1));
      return;
    }
    if (value.length >= length) return;
    hapticTap();
    onChange(value + key);
  };

  return (
    <View className="items-center w-full">
      <Animated.View style={{ transform: [{ translateX }] }} className="flex-row justify-center mb-10">
        {Array.from({ length }).map((_, i) => {
          const filled = i < value.length;
          return (
            <View
              key={i}
              className={`w-4 h-4 rounded-full mx-2 ${
                error ? "bg-danger" : filled ? "bg-primary-600" : "bg-slate-200"
              }`}
            />
          );
        })}
      </Animated.View>

      <View className="flex-row flex-wrap justify-center" style={{ width: 280 }}>
        {KEYS.map((key, i) => {
          if (key === "") return <View key={i} style={{ width: 80, height: 80 }} />;
          return (
            <Pressable
              key={i}
              onPress={() => press(key)}
              disabled={disabled}
              className="items-center justify-center rounded-full active:bg-slate-100 active:scale-95"
              style={{ width: 80, height: 80 }}
            >
              {key === "del" ? (
                <Delete size={24} color="#475569" />
              ) : (
                <Text className="text-3xl font-semibold text-slate-800">{key}</Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
