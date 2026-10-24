// Impresion de etiquetas en el telefono: directo a la MP210 por BLE.
// En web se usa printLabel.web.ts (manda la etiqueta a shelfsync-printer).
import { toTicket } from '../lib/toTicket';
import { getConnectedPrinter, printInventoryTicket } from './PrinterService';

type LabelItem = Parameters<typeof toTicket>[0];

/** false = hay que vincular la impresora en Ajustes antes de imprimir. */
export function isPrinterReady(): boolean {
  return !!getConnectedPrinter();
}

export async function printLabel(item: LabelItem): Promise<void> {
  await printInventoryTicket(toTicket(item));
}
