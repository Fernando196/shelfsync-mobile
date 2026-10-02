import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { Device } from 'react-native-ble-plx';
import { User, Bluetooth, BluetoothOff, Radar, LogOut, Printer, Ruler } from 'lucide-react-native';
import {
  requestBlePermissions,
  scanForPrinters,
  stopScan,
  connectToPrinter,
  disconnectPrinter,
  getConnectedPrinter,
  forgetSavedPrinter,
  printInventoryTicket,
} from '../printing/PrinterService';
import StatusPill from '../components/StatusPill';
import Chip from '../components/Chip';
import { useSession } from '../state/SessionContext';
import { hapticTap, hapticSuccess, hapticError } from '../lib/haptics';
import { readJSON, writeJSON, STORAGE_KEYS } from '../lib/storage';
import { Screen } from '../components/ui/Screen';
import { toTicket } from '../lib/toTicket';

const LABEL_FORMATS = ['58mm', '80mm'];

export default function SettingsScreen() {
  const { profile, resetSession } = useSession();
  const [scanning, setScanning] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedName, setConnectedName] = useState<string | null>(
    getConnectedPrinter()?.name ?? null,
  );
  const [labelFormat, setLabelFormat] = useState(LABEL_FORMATS[0]);

  useEffect(() => {
    readJSON<string>(STORAGE_KEYS.labelFormat).then((v) => v && setLabelFormat(v));
    return () => stopScan();
  }, []);

  // El auto-reconnect (RootNavigator) corre en background al desbloquear; si
  // ya conecto para cuando el operario entra a Ajustes, esto lo refleja.
  useFocusEffect(
    useCallback(() => {
      setConnectedName(getConnectedPrinter()?.name ?? null);
    }, []),
  );

  const startScan = useCallback(async () => {
    const ok = await requestBlePermissions();
    if (!ok) {
      Alert.alert(
        'Permisos requeridos',
        'Se necesita permiso de Bluetooth para buscar la impresora.',
      );
      return;
    }
    setDevices([]);
    setScanning(true);
    try {
      scanForPrinters(
        (device) =>
          setDevices((prev) => (prev.some((d) => d.id === device.id) ? prev : [...prev, device])),
        () => setScanning(false),
      );
    } catch (e: any) {
      setScanning(false);
      Alert.alert('Bluetooth no disponible', e.message ?? String(e));
      return;
    }
    setTimeout(() => {
      stopScan();
      setScanning(false);
    }, 8000);
  }, []);

  const handleConnect = async (device: Device) => {
    stopScan();
    setScanning(false);
    setConnecting(true);
    try {
      const connected = await connectToPrinter(device.id);
      setConnectedName(connected.name ?? device.id);
      hapticSuccess();
    } catch (e: any) {
      hapticError();
      Alert.alert('No se pudo conectar', e.message ?? String(e));
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnectPrinter();
    setConnectedName(null);
  };

  const handleForget = () => {
    Alert.alert('Olvidar impresora', 'La proxima vez que abras la app no se reconectara sola.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Olvidar',
        style: 'destructive',
        onPress: async () => {
          await disconnectPrinter();
          await forgetSavedPrinter();
          setConnectedName(null);
        },
      },
    ]);
  };

  const handleTestPrint = async () => {
    hapticTap();
    setTesting(true);
    try {
      const item = {
        id: 'pruebas',
        code: 1,
        name: 'Ticket de prueba',
        qty: 1,
        location: 'Bodega',
      };
      await printInventoryTicket(toTicket(item));
      hapticSuccess();
    } catch (e: any) {
      hapticError();
      Alert.alert('Error al imprimir', e.message ?? String(e));
    } finally {
      setTesting(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar turno',
      'Se cerrara tu sesion en este dispositivo. Tendras que iniciar sesion otra vez.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar turno', style: 'destructive', onPress: () => resetSession() },
      ],
    );
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 40 }}>
        <Text className="text-2xl font-bold text-slate-800 mb-5">Ajustes</Text>

        <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 flex-row items-center">
          <View className="w-12 h-12 rounded-full bg-indigo-50 items-center justify-center mr-3">
            <User size={22} color="#4f46e5" />
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-slate-800">
              {profile?.fullName ?? profile?.email ?? 'Operario'}
            </Text>
            <Text className="text-slate-400 text-xs">{profile?.email ?? 'Sin correo'}</Text>
          </View>
          <Pressable onPress={handleLogout} className="p-2 active:scale-95">
            <LogOut size={20} color="#f43f5e" />
          </Pressable>
        </View>

        <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="font-semibold text-slate-800">Impresora termica</Text>
            {connectedName ? (
              <StatusPill label={connectedName} tone="success" />
            ) : (
              <StatusPill label="Desconectada" tone="neutral" />
            )}
          </View>

          {connectedName ? (
            <View className="flex-row">
              <Pressable
                onPress={handleTestPrint}
                disabled={testing}
                className="flex-1 flex-row items-center justify-center bg-primary-600 rounded-xl py-3 mr-2 active:scale-95"
              >
                {testing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Printer size={16} color="#fff" />
                    <Text className="text-white font-semibold ml-2 text-sm">Ticket de prueba</Text>
                  </>
                )}
              </Pressable>
              <Pressable
                onPress={handleDisconnect}
                className="flex-row items-center justify-center bg-rose-50 rounded-xl px-4 active:scale-95"
              >
                <BluetoothOff size={16} color="#f43f5e" />
              </Pressable>
            </View>
          ) : null}

          {connectedName && (
            <Pressable onPress={handleForget} className="items-center mt-3 active:scale-95">
              <Text className="text-slate-400 text-xs">Olvidar esta impresora</Text>
            </Pressable>
          )}

          {!connectedName && (
            <Pressable
              onPress={startScan}
              disabled={scanning || connecting}
              className="flex-row items-center justify-center bg-indigo-50 rounded-xl py-3 active:scale-95"
            >
              {scanning ? (
                <Radar size={16} color="#4f46e5" />
              ) : (
                <Bluetooth size={16} color="#4f46e5" />
              )}
              <Text className="text-primary-700 font-semibold ml-2 text-sm">
                {scanning ? 'Buscando dispositivos...' : 'Buscar impresora'}
              </Text>
            </Pressable>
          )}

          {scanning && (
            <FlatList
              data={devices}
              keyExtractor={(d) => d.id}
              className="mt-3"
              style={{ maxHeight: 180 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleConnect(item)}
                  className="flex-row items-center justify-between py-3 border-b border-slate-100 active:bg-slate-50"
                >
                  <View>
                    <Text className="text-slate-700 font-medium">
                      {item.name || 'Dispositivo sin nombre'}
                    </Text>
                    <Text className="text-slate-400 text-xs">{item.id}</Text>
                  </View>
                  {connecting && <ActivityIndicator size="small" />}
                </Pressable>
              )}
              ListEmptyComponent={
                <Text className="text-slate-400 text-sm py-3">
                  Buscando dispositivos cercanos...
                </Text>
              }
            />
          )}
        </View>

        <View className="bg-white rounded-2xl border border-slate-200 p-4">
          <View className="flex-row items-center mb-3">
            <Ruler size={16} color="#4f46e5" />
            <Text className="font-semibold text-slate-800 ml-2">Formato de etiqueta</Text>
          </View>
          <View className="flex-row flex-wrap">
            {LABEL_FORMATS.map((f) => (
              <Chip
                key={f}
                label={f}
                selected={labelFormat === f}
                onPress={() => {
                  setLabelFormat(f);
                  writeJSON(STORAGE_KEYS.labelFormat, f);
                }}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
