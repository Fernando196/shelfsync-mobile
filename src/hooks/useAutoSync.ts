import { useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { syncAll } from '../lib/syncQueue';

/** Cuando el telefono recupera conexion, intenta subir lo que quedo pendiente
 * en la cola offline sin que el operario tenga que entrar a Sincronizacion. */
export function useAutoSyncOnReconnect(enabled: boolean) {
  const wasConnected = useRef<boolean | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = Boolean(state.isConnected && state.isInternetReachable !== false);
      if (isConnected && wasConnected.current === false) {
        syncAll().catch(() => {});
      }
      wasConnected.current = isConnected;
    });
    return unsubscribe;
  }, [enabled]);
}
