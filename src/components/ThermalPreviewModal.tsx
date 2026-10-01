import React, { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Printer, X, Bluetooth, TriangleAlert } from 'lucide-react-native';
import { getConnectedPrinter, printInventoryTicket } from '../printing/PrinterService';
import { hapticSuccess, hapticError, hapticTap } from '../lib/haptics';
import { formatDateEs } from '../lib/formatDate';
import { ThermalPreviewModalProps } from '../interfaces/thermal.interface';
import { prefixQRItem } from '../const/prefix.const';

export default function ThermalPreviewModal({
  visible,
  onClose,
  product,
  onGoToPrinterSetup,
}: ThermalPreviewModalProps) {
  const [printerName, setPrinterName] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (visible) setPrinterName(getConnectedPrinter()?.name ?? null);
  }, [visible]);

  const qrPayload = `${prefixQRItem}${product.id}`;
  const today = formatDateEs(new Date());

  const handlePrint = async () => {
    hapticTap();
    setPrinting(true);
    try {
      await printInventoryTicket(product, qrPayload);
      hapticSuccess();
      Alert.alert('Etiqueta enviada', 'La MP210 deberia estar imprimiendo la etiqueta ahora.');
    } catch (e: any) {
      hapticError();
      Alert.alert('Error al imprimir', e?.message ?? String(e));
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 justify-end">
        <View className="bg-white rounded-t-3xl p-5 pb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-slate-800">Etiqueta termica</Text>
            <Pressable onPress={onClose} className="p-1 active:scale-95">
              <X size={22} color="#64748b" />
            </Pressable>
          </View>

          {/* Vista previa monocromatica de la etiqueta */}
          <View className="items-center border border-dashed border-slate-300 rounded-2xl py-5 bg-slate-50">
            <QRCode value={qrPayload} size={128} color="#0f172a" backgroundColor="#f8fafc" />
            <Text className="font-bold text-slate-900 mt-3">{product.name || product.code}</Text>
            <Text className="text-slate-600 text-xs mt-1">Codigo {product.code}</Text>
            <Text className="text-slate-600 text-xs">{product.location || 'Sin ubicacion'}</Text>
            <Text className="text-slate-400 text-[10px] mt-1">{today}</Text>
          </View>

          <View className="mt-4">
            {printerName ? (
              <View className="flex-row items-center bg-emerald-50 rounded-xl px-3 py-2">
                <Bluetooth size={16} color="#10b981" />
                <Text className="text-emerald-700 text-sm font-medium ml-2">
                  {printerName} conectada
                </Text>
              </View>
            ) : (
              <Pressable
                onPress={onGoToPrinterSetup}
                className="flex-row items-center bg-amber-50 rounded-xl px-3 py-2 active:scale-95"
              >
                <TriangleAlert size={16} color="#f59e0b" />
                <Text className="text-amber-700 text-sm font-medium ml-2 flex-1">
                  Sin impresora conectada, toca para vincular
                </Text>
              </Pressable>
            )}
          </View>

          <Pressable
            onPress={handlePrint}
            disabled={!printerName || printing}
            className={`flex-row items-center justify-center rounded-xl py-4 mt-4 active:scale-95 ${
              !printerName || printing ? 'bg-slate-200' : 'bg-primary-600'
            }`}
          >
            {printing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Printer size={18} color={!printerName ? '#94a3b8' : '#fff'} />
                <Text
                  className={`font-semibold ml-2 ${!printerName ? 'text-slate-400' : 'text-white'}`}
                >
                  Imprimir etiqueta
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
