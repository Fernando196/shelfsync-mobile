import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  GestureResponderEvent,
  Image,
  Modal,
  PanResponder,
  PanResponderGestureState,
  Platform,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PhotoViewerProps {
  urls: string[];
  // Foto con la que abre; null = cerrado.
  index: number | null;
  onClose: () => void;
}

const MAX_ZOOM = 4;
const DOUBLE_TAP_ZOOM = 2.5;
const DOUBLE_TAP_MS = 280;
const useNativeDriver = Platform.OS !== 'web';

type Mode = 'none' | 'swipe' | 'pan' | 'pinch';

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

function touchDistance(e: GestureResponderEvent) {
  const [a, b] = e.nativeEvent.touches;
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
}

// Visor a pantalla completa: deslizar entre fotos, pellizco y doble toque para zoom,
// arrastrar para moverse con zoom. Todo con PanResponder y no con un ScrollView: en
// iOS Safari, una vez que arranca el scroll nativo los toques ya no se pueden
// cancelar y el pellizco hace zoom a toda la pagina.
export function PhotoViewer({ urls, index, onClose }: PhotoViewerProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(index ?? 0);
  const containerRef = useRef<View>(null);

  // swipeX mueve la tira de fotos; scale/tx/ty son el zoom de la foto actual.
  const swipeX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;

  // Valores numericos del zoom y del gesto en curso (los Animated.Value no se leen).
  const zoom = useRef({ s: 1, x: 0, y: 0 });
  const gesture = useRef({
    mode: 'none' as Mode,
    baseDx: 0,
    baseDy: 0,
    startDist: 0,
    start: { s: 1, x: 0, y: 0 },
    lastTap: 0,
  });

  // El PanResponder se crea una vez; lee lo actual desde aqui.
  const live = useRef({ current, count: urls.length, width, height });
  live.current = { current, count: urls.length, width, height };

  const applyZoom = (s: number, x: number, y: number, animated = false) => {
    const { width: w, height: h } = live.current;
    // Limites para no arrastrar la foto fuera de la pantalla.
    const maxX = (w * (s - 1)) / 2;
    const maxY = (h * (s - 1)) / 2;
    const next = { s, x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) };
    zoom.current = next;
    if (animated) {
      Animated.parallel([
        Animated.timing(scale, { toValue: next.s, duration: 180, useNativeDriver }),
        Animated.timing(tx, { toValue: next.x, duration: 180, useNativeDriver }),
        Animated.timing(ty, { toValue: next.y, duration: 180, useNativeDriver }),
      ]).start();
    } else {
      scale.setValue(next.s);
      tx.setValue(next.x);
      ty.setValue(next.y);
    }
  };

  // Al abrir o cambiar de foto se arranca sin zoom.
  useEffect(() => {
    if (index !== null) setCurrent(index);
  }, [index]);
  useEffect(() => {
    applyZoom(1, 0, 0);
  }, [current, index]);

  const pan = useMemo(() => {
    const startMode = (mode: Mode, g: PanResponderGestureState) => {
      gesture.current.mode = mode;
      gesture.current.baseDx = g.dx;
      gesture.current.baseDy = g.dy;
      gesture.current.start = { ...zoom.current };
    };

    const onTap = (e: GestureResponderEvent) => {
      const now = Date.now();
      if (now - gesture.current.lastTap > DOUBLE_TAP_MS) {
        gesture.current.lastTap = now;
        return;
      }
      gesture.current.lastTap = 0;
      if (zoom.current.s > 1) {
        applyZoom(1, 0, 0, true);
        return;
      }
      // Acercar hacia el punto tocado: ese punto se queda en su lugar.
      const { width: w, height: h } = live.current;
      const px = e.nativeEvent.pageX - w / 2;
      const py = e.nativeEvent.pageY - h / 2;
      applyZoom(DOUBLE_TAP_ZOOM, px * (1 - DOUBLE_TAP_ZOOM), py * (1 - DOUBLE_TAP_ZOOM), true);
    };

    const finishSwipe = (dx: number) => {
      const { current: i, count, width: w } = live.current;
      const step = dx < -w * 0.2 && i < count - 1 ? 1 : dx > w * 0.2 && i > 0 ? -1 : 0;
      Animated.timing(swipeX, { toValue: -step * w, duration: 180, useNativeDriver }).start(() => {
        if (step) setCurrent(i + step);
        swipeX.setValue(0);
      });
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        gesture.current.mode = 'none';
      },
      onPanResponderMove: (e, g) => {
        const gs = gesture.current;
        const touches = e.nativeEvent.touches.length;

        if (touches >= 2) {
          if (gs.mode !== 'pinch') {
            startMode('pinch', g);
            gs.startDist = touchDistance(e);
            swipeX.setValue(0);
          }
          const s = clamp((gs.start.s * touchDistance(e)) / gs.startDist, 1, MAX_ZOOM);
          const k = s / gs.start.s;
          applyZoom(s, gs.start.x * k, gs.start.y * k);
          return;
        }

        // Al soltar un dedo del pellizco se ignora el resto del gesto.
        if (gs.mode === 'pinch') return;

        if (gs.mode === 'none') {
          if (Math.abs(g.dx) < 8 && Math.abs(g.dy) < 8) return;
          if (zoom.current.s > 1) startMode('pan', g);
          else if (Math.abs(g.dx) > Math.abs(g.dy)) startMode('swipe', g);
          else return;
        }

        const dx = g.dx - gs.baseDx;
        const dy = g.dy - gs.baseDy;
        if (gs.mode === 'pan') applyZoom(gs.start.s, gs.start.x + dx, gs.start.y + dy);
        else swipeX.setValue(dx);
      },
      onPanResponderRelease: (e, g) => {
        const gs = gesture.current;
        if (gs.mode === 'none') onTap(e);
        else if (gs.mode === 'swipe') finishSwipe(g.dx - gs.baseDx);
        else if (gs.mode === 'pinch' && zoom.current.s < 1.05) applyZoom(1, 0, 0, true);
        gs.mode = 'none';
      },
    });
    // applyZoom solo usa refs y Animated.Value estables.
  }, []);

  // En web se bloquea todo movimiento tactil nativo dentro del visor (scroll y pellizco).
  useEffect(() => {
    if (Platform.OS !== 'web' || index === null) return;
    const node = containerRef.current as unknown as HTMLElement | null;
    if (!node) return;
    const block = (e: TouchEvent) => e.preventDefault();
    node.addEventListener('touchmove', block, { passive: false });
    return () => node.removeEventListener('touchmove', block);
  }, [index]);

  // Anterior, actual y siguiente, para que se vean al deslizar.
  const slides = [-1, 0, 1]
    .map((offset) => ({ offset, url: urls[current + offset] }))
    .filter((s) => !!s.url);

  return (
    <Modal visible={index !== null} animationType="fade" onRequestClose={onClose}>
      <View ref={containerRef} className="flex-1 bg-black overflow-hidden" {...pan.panHandlers}>
        <Animated.View style={{ flex: 1, transform: [{ translateX: swipeX }] }}>
          {slides.map((s) => (
            <Animated.View
              key={s.url}
              style={{
                position: 'absolute',
                top: 0,
                left: s.offset * width,
                width,
                height,
                transform:
                  s.offset === 0 ? [{ translateX: tx }, { translateY: ty }, { scale }] : [],
              }}
            >
              <Image source={{ uri: s.url }} resizeMode="contain" style={{ width, height }} />
            </Animated.View>
          ))}
        </Animated.View>

        <View
          className="absolute left-0 right-0 flex-row items-center justify-between px-4"
          style={{ top: insets.top + 8 }}
        >
          <Text className="text-white text-base font-semibold">
            {urls.length > 1 ? `${current + 1} / ${urls.length}` : ''}
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center active:opacity-70"
          >
            <X size={22} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
