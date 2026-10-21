import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { Device } from 'react-native-ble-plx';
import { User, Bluetooth, BluetoothOff, Radar, LogOut, Printer, Ruler, Languages } from 'lucide-react-native';
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
import StatusPill from '../components/item/StatusPill';
import { useSession } from '../state/SessionContext';
import { hapticTap, hapticSuccess, hapticError } from '../lib/haptics';
import { readJSON, writeJSON, STORAGE_KEYS } from '../lib/storage';
import { Screen } from '../components/ui/Screen';
import { toTicket } from '../lib/toTicket';
import Chip from '../components/ui/Chip';
import { COLORS } from '../const/theme.const';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, setLanguage } from '../i18n';

const LABEL_FORMATS = ['58mm', '80mm'];

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
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
        t('settings.permissionsTitle'),
        t('settings.blePermission'),
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
      Alert.alert(t('settings.bleUnavailable'), e.message ?? String(e));
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
      Alert.alert(t('settings.connectFailed'), e.message ?? String(e));
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnectPrinter();
    setConnectedName(null);
  };

  const handleForget = () => {
    Alert.alert(t('settings.forgetTitle'), t('settings.forgetMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.forget'),
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
        name: t('settings.testTicket'),
        qty: 1,
        location: t('settings.testLocation'),
      };
      await printInventoryTicket(toTicket(item));
      hapticSuccess();
    } catch (e: any) {
      hapticError();
      Alert.alert(t('detail.printError'), e.message ?? String(e));
    } finally {
      setTesting(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('settings.logoutTitle'),
      t('settings.logoutMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('settings.logoutTitle'), style: 'destructive', onPress: () => resetSession() },
      ],
    );
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 40 }}>
        <Text className="text-2xl font-bold text-slate-800 mb-5">{t('tabs.settings')}</Text>

        <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 flex-row items-center">
          <View className="w-12 h-12 rounded-full bg-primary-50 items-center justify-center mr-3">
            <User size={22} color={COLORS.primary} />
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-slate-800">
              {profile?.fullName ?? profile?.email ?? t('settings.operator')}
            </Text>
            <Text className="text-slate-400 text-xs">{profile?.email ?? t('settings.noEmail')}</Text>
          </View>
          <Pressable onPress={handleLogout} className="p-2 active:scale-95">
            <LogOut size={20} color="#f43f5e" />
          </Pressable>
        </View>

        <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
          <View className="flex-row items-center mb-3">
            <Languages size={16} color={COLORS.primary} />
            <Text className="font-semibold text-slate-800 ml-2">{t('settings.language')}</Text>
          </View>
          <View className="flex-row bg-slate-100 rounded-xl p-1">
            {LANGUAGES.map((lang) => {
              const active = i18n.language === lang.code;
              return (
                <Pressable
                  key={lang.code}
                  onPress={() => setLanguage(lang.code)}
                  className={`flex-1 items-center py-2.5 rounded-lg ${active ? 'bg-white' : ''}`}
                >
                  <Text
                    className={`text-sm font-semibold ${active ? 'text-slate-900' : 'text-slate-500'}`}
                  >
                    {lang.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="font-semibold text-slate-800">{t('settings.printer')}</Text>
            {connectedName ? (
              <StatusPill label={connectedName} tone="success" />
            ) : (
              <StatusPill label={t('settings.disconnected')} tone="neutral" />
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
                    <Text className="text-white font-semibold ml-2 text-sm">{t('settings.testTicket')}</Text>
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
              <Text className="text-slate-400 text-xs">{t('settings.forgetPrinter')}</Text>
            </Pressable>
          )}

          {!connectedName && (
            <Pressable
              onPress={startScan}
              disabled={scanning || connecting}
              className="flex-row items-center justify-center bg-primary-50 rounded-xl py-3 active:scale-95"
            >
              {scanning ? (
                <Radar size={16} color={COLORS.primary} />
              ) : (
                <Bluetooth size={16} color={COLORS.primary} />
              )}
              <Text className="text-primary-700 font-semibold ml-2 text-sm">
                {scanning ? t('settings.searching') : t('settings.searchPrinter')}
              </Text>
            </Pressable>
          )}

          {scanning && (
            <View className="mt-3">
              {devices.length === 0 ? (
                <Text className="text-slate-400 text-sm py-3">
                  {t('settings.searchingNearby')}
                </Text>
              ) : (
                devices.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => handleConnect(item)}
                    className="flex-row items-center justify-between py-3 border-b border-slate-100 active:bg-slate-50"
                  >
                    <View>
                      <Text className="text-slate-700 font-medium">
                        {item.name || t('settings.unnamedDevice')}
                      </Text>
                      <Text className="text-slate-400 text-xs">{item.id}</Text>
                    </View>
                    {connecting && <ActivityIndicator size="small" />}
                  </Pressable>
                ))
              )}
            </View>
          )}
        </View>

        <View className="bg-white rounded-2xl border border-slate-200 p-4">
          <View className="flex-row items-center mb-3">
            <Ruler size={16} color={COLORS.primary} />
            <Text className="font-semibold text-slate-800 ml-2">{t('settings.labelFormat')}</Text>
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
