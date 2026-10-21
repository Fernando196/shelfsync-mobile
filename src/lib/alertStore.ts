import { AlertButton } from 'react-native';

// Store minima para la alerta activa en web: alertPolyfill.web.ts la llena y
// AlertHost.web.tsx la pinta como modal.
export type AlertState = { title: string; message?: string; buttons: AlertButton[] } | null;

let current: AlertState = null;
const listeners = new Set<(a: AlertState) => void>();

function emit() {
  listeners.forEach((fn) => fn(current));
}

export function subscribeAlert(fn: (a: AlertState) => void) {
  listeners.add(fn);
  fn(current);
  return () => {
    listeners.delete(fn);
  };
}

export function showAlert(a: NonNullable<AlertState>) {
  current = a;
  emit();
}

export function closeAlert() {
  current = null;
  emit();
}
