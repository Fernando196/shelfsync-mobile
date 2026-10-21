import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Boxes, Settings, ScanLine } from 'lucide-react-native';
import { hapticTap } from '../../lib/haptics';
import { COLORS } from '../../const/theme.const';

const ICONS: Record<string, any> = {
  Inventory: Boxes,
  Settings: Settings,
};

const LABELS: Record<string, string> = {
  Inventory: 'Inventario',
  Settings: 'Ajustes',
};

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // isInteraction: false — on web this runs in JS, and an endless "interaction" blocks
    // InteractionManager, so FlatList never renders past its first 10 rows.
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 900,
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const visibleRoutes = state.routes.filter((r) => r.name !== 'Scanner');
  const scannerFocused = state.routes[state.index]?.name === 'Scanner';

  const half = Math.ceil(visibleRoutes.length / 2);
  const leftRoutes = visibleRoutes.slice(0, half);
  const rightRoutes = visibleRoutes.slice(half);

  const renderTab = (route: (typeof visibleRoutes)[number]) => {
    const routeIndex = state.routes.findIndex((r) => r.key === route.key);
    const focused = state.index === routeIndex;
    const Icon = ICONS[route.name] ?? Boxes;

    return (
      <Pressable
        key={route.key}
        onPress={() => {
          hapticTap();
          navigation.navigate(route.name);
        }}
        className="flex-1 items-center justify-center py-2 active:scale-95"
      >
        <Icon size={22} color={focused ? COLORS.primary : '#94a3b8'} />
        <Text
          className={`text-[10px] mt-1 font-medium ${focused ? 'text-primary-600' : 'text-slate-400'}`}
        >
          {LABELS[route.name] ?? route.name}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={{ paddingBottom: insets.bottom }} className="bg-white border-t border-slate-200">
      <View className="flex-row items-center" style={{ height: 60 }}>
        {leftRoutes.map(renderTab)}
        <View style={{ width: 72 }} />
        {rightRoutes.map(renderTab)}
      </View>

      <View className="absolute self-center" style={{ top: -28 }}>
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <Pressable
            onPress={() => {
              hapticTap();
              navigation.navigate('Scanner');
            }}
            className={`w-16 h-16 rounded-full items-center justify-center shadow-lg active:scale-95 ${
              scannerFocused ? 'bg-accent-700' : 'bg-accent-600'
            }`}
            style={{ elevation: 6 }}
          >
            <ScanLine size={26} color="#fff" />
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}
