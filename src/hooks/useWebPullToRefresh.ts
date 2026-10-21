import { RefObject, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

// Distancias en px. Al soltar pasando PULL_TRIGGER se actualiza.
const PULL_MAX = 110;
export const PULL_TRIGGER = 64;
export const PULL_REFRESHING = 56;
const SETTLE = 'transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1)';

type Node = { getScrollableNode?: () => unknown } | null;

/**
 * "Jalar para actualizar" en web (react-native-web deja RefreshControl vacio).
 * Mientras se jala mueve la lista y el indicador con estilos directos del DOM, sin
 * re-render de React por cada movimiento: asi va fluido. Solo `refreshing` es estado.
 * En nativo no hace nada: ahi se usa RefreshControl.
 */
export function useWebPullToRefresh(
  listRef: RefObject<Node>,
  indicatorRef: RefObject<unknown>,
  iconRef: RefObject<unknown>,
  onRefresh: () => Promise<void>,
) {
  const [refreshing, setRefreshing] = useState(false);
  const refresh = useRef(onRefresh);
  refresh.current = onRefresh;

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const list = listRef.current?.getScrollableNode?.() as HTMLElement | undefined;
    const indicator = indicatorRef.current as HTMLElement | null;
    if (!list || !indicator) return;

    let startY: number | null = null;
    let dist = 0;
    let busy = false;
    let frame = 0;

    // Pinta la posicion; `animate` = transicion suave (al soltar), sin ella sigue al dedo.
    const paint = (y: number, animate: boolean) => {
      const transition = animate ? SETTLE : 'none';
      list.style.transition = transition;
      list.style.transform = y ? `translateY(${y}px)` : '';
      indicator.style.transition = animate ? 'opacity 200ms' : 'none';
      indicator.style.opacity = String(Math.min(y / PULL_TRIGGER, 1));
      // Se lee en cada pintado: el icono se desmonta mientras se muestra el spinner.
      const icon = iconRef.current as HTMLElement | null;
      if (icon) icon.style.transform = `rotate(${(y / PULL_TRIGGER) * 270}deg)`;
    };

    const onStart = (e: TouchEvent) => {
      startY = !busy && list.scrollTop <= 0 && e.touches.length === 1 ? e.touches[0].clientY : null;
      dist = 0;
    };

    const onMove = (e: TouchEvent) => {
      if (startY === null) return;
      const dy = e.touches[0].clientY - startY;
      if (dy <= 0 || list.scrollTop > 0) {
        // Se esta desplazando la lista normal: soltar el gesto.
        if (dist) paint(0, false);
        dist = 0;
        if (list.scrollTop > 0) startY = null;
        return;
      }
      // Evita el rebote nativo de Safari mientras se jala.
      e.preventDefault();
      // Resistencia progresiva: cuesta mas entre mas se jala.
      dist = PULL_MAX * (1 - Math.exp(-dy / 140));
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => paint(dist, false));
    };

    const onEnd = async () => {
      if (startY === null) return;
      startY = null;
      cancelAnimationFrame(frame);
      if (dist < PULL_TRIGGER) {
        paint(0, true);
        return;
      }
      busy = true;
      paint(PULL_REFRESHING, true);
      setRefreshing(true);
      try {
        await refresh.current();
      } finally {
        busy = false;
        setRefreshing(false);
        paint(0, true);
      }
    };

    indicator.style.opacity = '0';
    list.addEventListener('touchstart', onStart, { passive: true });
    list.addEventListener('touchmove', onMove, { passive: false });
    list.addEventListener('touchend', onEnd);
    list.addEventListener('touchcancel', onEnd);
    return () => {
      cancelAnimationFrame(frame);
      list.removeEventListener('touchstart', onStart);
      list.removeEventListener('touchmove', onMove);
      list.removeEventListener('touchend', onEnd);
      list.removeEventListener('touchcancel', onEnd);
    };
  }, [listRef, indicatorRef, iconRef]);

  return { refreshing };
}
