// Impresion de etiquetas en web: Safari no tiene Bluetooth, asi que la
// etiqueta se manda a shelfsync-printer (corre en la laptop con la MP210) y
// esta responde 200 cuando ya salio impresa.
import i18n from '../i18n';
import { getAccessToken } from '../lib/auth';
import { toTicket } from '../lib/toTicket';

type LabelItem = Parameters<typeof toTicket>[0];

const PRINTER_URL = process.env.EXPO_PUBLIC_PRINTER_URL;
// La API espera hasta 15s a la impresora; damos margen para la red.
const PRINT_TIMEOUT_MS = 25000;

/** En web no hay nada que vincular: la impresora vive del lado de la API. */
export function isPrinterReady(): boolean {
  return true;
}

export async function printLabel(item: LabelItem): Promise<void> {
  if (!PRINTER_URL) throw new Error(i18n.t('errors.noPrintServer'));

  const token = await getAccessToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PRINT_TIMEOUT_MS);
  try {
    const res = await fetch(`${PRINTER_URL}/print/label`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(toTicket(item)),
      signal: controller.signal,
    });
    // Un 401 aqui no cierra la sesion: puede ser solo un JWT_SECRET distinto
    // en la laptop, la sesion con shelfsync-api sigue valida.
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `Error ${res.status}`);
    }
  } catch (e: any) {
    if (e?.name === 'AbortError') throw new Error(i18n.t('errors.printTimeout'));
    if (e instanceof TypeError) throw new Error(i18n.t('errors.printServerUnreachable'));
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}
