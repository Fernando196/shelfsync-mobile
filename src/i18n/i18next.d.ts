import es from './locales/es';

// Llaves de t() tipadas: un typo en una llave falla el typecheck.
declare module 'i18next' {
  interface CustomTypeOptions {
    resources: { translation: typeof es };
  }
}
