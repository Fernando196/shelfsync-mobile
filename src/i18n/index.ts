import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { readJSON, writeJSON, STORAGE_KEYS } from '../lib/storage';
import es from './locales/es';
import en from './locales/en';

export type Language = 'es' | 'en';

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
];

// Sin preferencia guardada se usa el idioma del telefono (ingles o, si no, español).
function deviceLanguage(): Language {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
    return locale.startsWith('en') ? 'en' : 'es';
  } catch {
    return 'es';
  }
}

i18n.use(initReactI18next).init({
  resources: { es: { translation: es }, en: { translation: en } },
  lng: deviceLanguage(),
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
});

/** Aplica el idioma elegido en Ajustes. Se llama al arrancar, antes de pintar la app. */
export async function loadSavedLanguage(): Promise<void> {
  const saved = await readJSON<Language>(STORAGE_KEYS.language);
  if (saved && saved !== i18n.language) await i18n.changeLanguage(saved);
}

/** Cambia el idioma y lo guarda (AsyncStorage). */
export async function setLanguage(lang: Language): Promise<void> {
  await i18n.changeLanguage(lang);
  await writeJSON(STORAGE_KEYS.language, lang);
}

/** Locale para fechas (toLocaleString) segun el idioma actual. */
export function dateLocale(): string {
  return i18n.language === 'en' ? 'en-US' : 'es-MX';
}

export default i18n;
