// Servicio de impresion BLE para la MP210, usando react-native-ble-plx
// (funciona igual en Android e iOS, sin necesitar certificacion MFi porque
// la impresora habla BLE nativo, no Bluetooth clasico/SPP).
//
// UUIDs confirmados a mano con nRF Connect contra la impresora real:
// enviamos "48656C6C6F0A" (bytes crudos) a la characteristic de escritura y
// vimos "Hello" salir impreso. Ver README.md para el detalle de como se
// dedujeron.
import { BleManager, Device } from "react-native-ble-plx";
import { Platform, PermissionsAndroid } from "react-native";
import { buildInventoryTicket, InventoryTicketData } from "./escpos";
import { bytesToBase64, chunkBytes } from "./bytes";
import { readJSON, writeJSON, STORAGE_KEYS } from "../lib/storage";

export const PRINTER_SERVICE_UUID = "49535343-fe7d-4ae5-8fa9-9fafd205e455";
export const PRINTER_WRITE_CHARACTERISTIC_UUID = "49535343-8841-43f4-a8d4-ecbe34729bb3";
export const PRINTER_NOTIFY_CHARACTERISTIC_UUID = "49535343-1e4d-4bd9-ba61-23c647249616";

// El MTU por defecto de BLE deja ~20 bytes utiles por paquete. Si mas adelante
// negocias un MTU mayor con device.requestMTU(...), puedes subir esto.
const CHUNK_SIZE = 20;
const CHUNK_DELAY_MS = 15;

// Si notas texto/QR corrupto o incompleto al imprimir, cambia esto a true:
// manda cada paquete con confirmacion (mas lento pero mas confiable en
// modulos BLE baratos que no tienen control de flujo real).
const USE_WRITE_WITH_RESPONSE = false;

// El BleManager se crea perezosamente (no al importar el modulo). El modulo
// nativo de react-native-ble-plx no existe en Expo Go, asi que instanciarlo
// de una vez tumbaba toda la app apenas se abria (HomeScreen importa este
// archivo). Ahora solo truena, con un mensaje claro, si de verdad usas la
// impresora sin el dev client compilado.
let managerInstance: BleManager | null = null;
function getManager(): BleManager {
  if (!managerInstance) {
    try {
      managerInstance = new BleManager();
    } catch {
      throw new Error(
        "Bluetooth (BLE) no esta disponible en esta app. La impresora solo funciona " +
          "con el 'dev client' compilado (ver README), no en Expo Go."
      );
    }
  }
  return managerInstance;
}
let connectedDevice: Device | null = null;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/** Pide los permisos de Android necesarios para escanear/conectar BLE. En iOS
 * el propio sistema muestra su dialogo cuando haga falta (NSBluetoothAlwaysUsageDescription
 * en Info.plist, ya configurado en app.json). */
export async function requestBlePermissions(): Promise<boolean> {
  if (Platform.OS !== "android") return true;

  if (Platform.Version >= 31) {
    const results = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);
    return Object.values(results).every((r) => r === PermissionsAndroid.RESULTS.GRANTED);
  }

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

/**
 * Escanea dispositivos BLE cercanos para que el operario elija la MP210 por
 * nombre de la lista. No se filtra por PRINTER_SERVICE_UUID: la MP210 (como
 * la mayoria de modulos BLE baratos) no incluye el UUID del servicio en el
 * paquete de advertising inicial - solo aparece despues de conectar y llamar
 * discoverAllServicesAndCharacteristics(). Filtrar el scan por ese UUID hace
 * que nunca aparezca nada, aunque el Bluetooth del telefono si la vea.
 * Llama a stopScan() cuando encuentres la que quieres o el usuario cancele.
 */
export function scanForPrinters(
  onFound: (device: Device) => void,
  onError?: (e: Error) => void
): void {
  getManager().startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
    if (error) {
      onError?.(error);
      return;
    }
    if (device) onFound(device);
  });
}

export function stopScan(): void {
  // No forzar la creacion del manager solo para detener un escaneo que
  // nunca arranco (p.ej. al desmontar HomeScreen en Expo Go).
  managerInstance?.stopDeviceScan();
}

interface SavedPrinter {
  id: string;
  name: string | null;
}

export async function getSavedPrinter(): Promise<SavedPrinter | null> {
  return readJSON<SavedPrinter>(STORAGE_KEYS.lastPrinter);
}

export async function forgetSavedPrinter(): Promise<void> {
  await writeJSON(STORAGE_KEYS.lastPrinter, null);
}

export async function connectToPrinter(deviceId: string): Promise<Device> {
  const device = await getManager().connectToDevice(deviceId, { autoConnect: false });
  await device.discoverAllServicesAndCharacteristics();
  connectedDevice = device;
  await writeJSON(STORAGE_KEYS.lastPrinter, { id: device.id, name: device.name ?? null } as SavedPrinter);

  device.onDisconnected(() => {
    if (connectedDevice?.id === deviceId) connectedDevice = null;
  });

  return device;
}

export function getConnectedPrinter(): Device | null {
  return connectedDevice;
}

export async function disconnectPrinter(): Promise<void> {
  if (connectedDevice) {
    await getManager().cancelDeviceConnection(connectedDevice.id);
    connectedDevice = null;
  }
}

/** Se llama al desbloquear la app: si hubo una MP210 conectada antes y esta
 * a rango, se reconecta sola sin que el operario tenga que ir a Ajustes. Si
 * no esta disponible (apagada, fuera de rango, Expo Go sin dev client) falla
 * en silencio - es un intento de conveniencia, no una accion que el usuario pidio. */
export async function tryAutoReconnect(): Promise<Device | null> {
  if (connectedDevice) return connectedDevice;
  const saved = await getSavedPrinter();
  if (!saved) return null;
  try {
    return await connectToPrinter(saved.id);
  } catch {
    return null;
  }
}

/**
 * Escribe un arreglo de bytes crudo a la impresora, troceado para respetar el
 * MTU de BLE y con una pausa corta entre paquetes (estos modulos baratos no
 * tienen control de flujo real: mandar todo pegado hace que pierdan bytes).
 */
async function writeRawBytes(bytes: number[]): Promise<void> {
  if (!connectedDevice) {
    throw new Error("No hay una impresora conectada. Conecta la MP210 primero.");
  }

  const chunks = chunkBytes(bytes, CHUNK_SIZE);
  for (const chunk of chunks) {
    const payload = bytesToBase64(chunk);
    if (USE_WRITE_WITH_RESPONSE) {
      await connectedDevice.writeCharacteristicWithResponseForService(
        PRINTER_SERVICE_UUID,
        PRINTER_WRITE_CHARACTERISTIC_UUID,
        payload
      );
    } else {
      await connectedDevice.writeCharacteristicWithoutResponseForService(
        PRINTER_SERVICE_UUID,
        PRINTER_WRITE_CHARACTERISTIC_UUID,
        payload
      );
    }
    await sleep(CHUNK_DELAY_MS);
  }
}

export async function printInventoryTicket(data: InventoryTicketData): Promise<void> {
  const ticketBytes = buildInventoryTicket(data);
  await writeRawBytes(ticketBytes);
}

export function destroyManager(): void {
  managerInstance?.destroy();
}
