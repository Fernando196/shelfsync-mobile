import { Appearance } from 'react-native';

// Colores para props que no aceptan clases (iconos, ActivityIndicator, Switch).
// Deben coincidir con tailwind.config.js. Paleta "pizarra industrial + verde stock".
// `primary` es un getter: en modo oscuro el pizarra oscuro no se veria sobre el fondo,
// asi que se usa uno claro segun el tema del sistema al momento de leerlo.
export const COLORS = {
  get primary() {
    return Appearance.getColorScheme() === 'dark' ? '#e2e8f0' : '#334155';
  },
  accent: '#059669',
  muted: '#94a3b8',
};
