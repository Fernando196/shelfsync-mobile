import { dateLocale } from '../i18n';

/** Texto de un input a numero. '' = sin valor; acepta coma decimal ("1,500.50" o "1500,5").
 * Redondea a 2 decimales, que es lo maximo que acepta la API. */
export function parseMoney(text: string): number | null {
  const clean = text.trim().replace(/[^0-9.,]/g, '');
  if (!clean) return null;
  const normalized = clean.includes('.') ? clean.replace(/,/g, '') : clean.replace(',', '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
}

/** "$1,299.50" con los separadores del idioma actual (sin codigo de moneda). */
export function formatMoney(value: number): string {
  return `$${value.toLocaleString(dateLocale(), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
