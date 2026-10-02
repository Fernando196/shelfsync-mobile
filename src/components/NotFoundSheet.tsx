import { Alert, Pressable, Text, View } from 'react-native';
import { BottomSheet } from './ui/BottomSheet';
import { IProductLookup } from '../interfaces/productLookup.interface';
import { useState } from 'react';
import { Input } from './ui/Input';
import { attachBarcode, findProductByCode } from '../services/productLookup.service';
import { hapticError } from '../lib/haptics';

export function NotFoundSheet({ code, onClose, onFound, onCreateNew }: NotFoundSheetProps) {
  const [sku, setSku] = useState<string>('');
  const [searching, setSearching] = useState<boolean>(false);

  const handleSearch = async () => {
    setSearching(true);
    try {
      const productLookup = await findProductByCode(sku.trim());
      if (!productLookup) {
        if (!productLookup) {
          const typed = sku.trim();
          Alert.alert(
            'SKU no encontrado',
            `No existe ningun producto con el SKU ${typed}.\n¿Es un producto nuevo?`,
            [
              { text: 'Corregir', style: 'cancel' },
              {
                text: 'Crear producto',
                onPress: () => onCreateNew(typed),
              },
            ],
          );
        }
        return;
      }

      if (!productLookup?.barcode) {
        await attachBarcode(productLookup.id, code);
      }
      onFound({ ...productLookup, barcode: productLookup.barcode ?? code });
    } catch (err: any) {
      hapticError();
      Alert.alert('Error al buscar', err?.message ?? String(err));
    } finally {
      setSearching(false);
    }
  };

  return (
    <BottomSheet title="Producto no encontrado">
      <View className="flex flex-row">
        <Text className="font-bold text-base">Código:</Text>
        <Text className="text-base ml-2">{code}</Text>
      </View>
      <Input
        value={sku}
        onChangeText={(v) => setSku(v)}
        label="SKU del manifiesto"
        keyboardType="number-pad"
        autoFocus
        className="mt-4"
      />

      <View className="flex-row mt-5">
        <Pressable
          onPress={() => onClose()}
          className="flex-1 bg-slate-100 rounded-xl py-3 mr-2 items-center"
        >
          <Text className="text-slate-700 font-semibold text-sm">Cancelar</Text>
        </Pressable>
        <Pressable
          className={`flex-1 bg-primary-600 rounded-xl py-3 items-center ${searching ? 'opacity-50' : ''}`}
          disabled={searching || !sku.trim()}
          onPress={() => handleSearch()}
        >
          <Text className="text-sm font-semibold text-white">Buscar</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

interface NotFoundSheetProps {
  code: string;
  onClose: () => void;
  onFound: (product: IProductLookup) => void;
  onCreateNew: (sku: string) => void;
}
