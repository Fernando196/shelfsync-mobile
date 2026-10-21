import { useEffect, useRef } from 'react';
import { Animated, Platform, View } from 'react-native';

const ROWS = 6;

// Bloque gris del skeleton; mismo tono que el fondo de la miniatura de ProductCard.
function Bone({ className }: { className: string }) {
  return <View className={`bg-slate-200 dark:bg-slate-700 ${className}`} />;
}

// Tarjetas "fantasma" con la misma forma que ProductCard mientras carga la lista.
export function InventorySkeleton() {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // isInteraction: false — un loop infinito como "interaccion" bloquea InteractionManager
    // y en web el FlatList deja de paginar (mismo caso que el pulso del tab bar).
    const timing = (toValue: number) =>
      Animated.timing(pulse, {
        toValue,
        duration: 700,
        useNativeDriver: Platform.OS !== 'web',
        isInteraction: false,
      });
    const loop = Animated.loop(Animated.sequence([timing(0.45), timing(1)]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    // Opacidad en style: NativeWind no aplica className a Animated.View en web.
    <Animated.View style={{ opacity: pulse }}>
      {Array.from({ length: ROWS }, (_, i) => (
        <View
          key={i}
          className="flex-row bg-white dark:bg-slate-900 rounded-2xl p-3 mb-3 border border-slate-200 dark:border-slate-700"
        >
          <Bone className="w-16 h-16 rounded-xl mr-3" />
          <View className="flex-1 justify-between py-0.5">
            <View className="flex-row items-center justify-between">
              <Bone className="h-4 rounded-md w-1/2" />
              <Bone className="h-5 rounded-full w-16" />
            </View>
            <Bone className="h-3 rounded-md w-1/3" />
            <View className="flex-row items-center justify-between">
              <Bone className="h-3 rounded-md w-2/5" />
              <Bone className="h-4 rounded-full w-8" />
            </View>
          </View>
        </View>
      ))}
    </Animated.View>
  );
}
