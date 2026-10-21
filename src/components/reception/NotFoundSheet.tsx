import { Alert, Platform, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheet, BottomSheetHandle } from '../ui/BottomSheet';
import { IProductLookup } from '../../interfaces/productLookup.interface';
import { useState, useRef } from 'react';
import { Input } from '../ui/Input';
import { attachBarcode, findProductByCode } from '../../services/productLookup.service';
import { hapticError } from '../../lib/haptics';

export function NotFoundSheet({ code, onClose, onFound, onCreateNew }: NotFoundSheetProps) {
  const { t } = useTranslation();
  const sheetRef = useRef<BottomSheetHandle>(null);
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
            t('reception.skuNotFoundTitle'),
            t('reception.skuNotFoundMessage', { sku: typed }),
            [
              { text: t('reception.fix'), style: 'cancel' },
              {
                text: t('reception.createProduct'),
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
      Alert.alert(t('reception.searchError'), err?.message ?? String(err));
    } finally {
      setSearching(false);
    }
  };

  return (
    <BottomSheet ref={sheetRef} title={t('reception.productNotFound')} onClose={onClose}>
      <View className="flex flex-row">
        <Text className="font-bold text-base">{t('reception.codeLabel')}</Text>
        <Text className="text-base ml-2">{code}</Text>
      </View>
      <Input
        value={sku}
        onChangeText={(v) => setSku(v)}
        label={t('reception.manifestSku')}
        keyboardType="number-pad"
        // En web (iOS) el foco con el sheet aun fuera de pantalla hace que Safari desplace la pagina
        autoFocus={Platform.OS !== 'web'}
        className="mt-4"
      />

      <View className="flex-row mt-5">
        <Pressable
          onPress={() => sheetRef.current?.close()}
          className="flex-1 bg-slate-100 rounded-xl py-3 mr-2 items-center"
        >
          <Text className="text-slate-700 font-semibold text-sm">{t('common.cancel')}</Text>
        </Pressable>
        <Pressable
          className={`flex-1 bg-primary-600 rounded-xl py-3 items-center ${searching ? 'opacity-50' : ''}`}
          disabled={searching || !sku.trim()}
          onPress={() => handleSearch()}
        >
          <Text className="text-sm font-semibold text-white">{t('reception.search')}</Text>
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
