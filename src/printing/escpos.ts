// Construye los comandos ESC/POS crudos para la MP210. Misma logica que el
// backend Node (backend/routes no la usa, vive solo aqui) - el transporte es
// distinto (BLE en vez de puerto serie) pero los bytes que se mandan son
// exactamente los mismos.
import { utf8Bytes } from "./bytes";
import { formatDateTimeEs } from "../lib/formatDate";

const ESC = 0x1b;
const GS = 0x1d;

function textBytes(str: string): number[] {
  return [...utf8Bytes(str), 0x0a]; // 0x0a = salto de linea: sin esto la impresora
  // se queda esperando y no imprime nada (ver nota en el README sobre el buffer
  // de linea de la impresora).
}

export type ErrorCorrection = "L" | "M" | "Q" | "H";

export function qrCommand(
  data: string,
  opts: { size?: number; errorCorrection?: ErrorCorrection } = {}
): number[] {
  const size = opts.size ?? 6;
  const ecMap: Record<ErrorCorrection, number> = { L: 48, M: 49, Q: 50, H: 51 };
  const ec = ecMap[opts.errorCorrection ?? "M"];

  const dataBytes = utf8Bytes(data);
  const storeLen = dataBytes.length + 3;
  const pL = storeLen & 0xff;
  const pH = (storeLen >> 8) & 0xff;

  return [
    GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00, // seleccionar modelo 2
    GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, size, // tamano del modulo (1-16)
    GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, ec, // correccion de errores
    GS, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30,
    ...dataBytes, // datos que se guardan en el buffer de la impresora
    GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30, // imprimir el QR guardado
  ];
}

export interface InventoryTicketData {
  sku: string;
  name?: string;
  qty?: number | string;
  location?: string;
}

export function buildInventoryTicket(data: InventoryTicketData): number[] {
  const now = formatDateTimeEs(new Date());
  const qrPayload = JSON.stringify(data);

  return [
    ESC, 0x40, // init
    ESC, 0x61, 1, // centrar
    ESC, 0x45, 1, // negrita on
    GS, 0x21, 0x11, // doble ancho/alto
    ...textBytes("INVENTARIO"),
    GS, 0x21, 0x00, // tamano normal
    ESC, 0x45, 0, // negrita off
    ...textBytes("------------------------"),
    ESC, 0x61, 0, // izquierda
    ...textBytes(`SKU:       ${data.sku}`),
    ...textBytes(`Nombre:    ${data.name || "-"}`),
    ...textBytes(`Cantidad:  ${data.qty ?? "-"}`),
    ...textBytes(`Ubicacion: ${data.location || "-"}`),
    ...textBytes(`Fecha:     ${now}`),
    ...textBytes(" "),
    ESC, 0x61, 1, // centrar el QR
    ...qrCommand(qrPayload, { size: 6, errorCorrection: "M" }),
    ESC, 0x64, 3, // avanzar 3 lineas
    GS, 0x56, 0x00, // corte total
  ];
}
