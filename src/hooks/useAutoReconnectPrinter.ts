import { useEffect } from "react";
import { tryAutoReconnect } from "../printing/PrinterService";

/** Intenta reconectar la ultima MP210 conocida una vez que la app se desbloquea. */
export function useAutoReconnectPrinter(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    tryAutoReconnect().catch(() => {});
  }, [enabled]);
}
