import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheet, BottomSheetHandle } from '../ui/BottomSheet';
import { Input } from '../ui/Input';
import ButtonPill from '../ui/ButtonPill';
import { parseMoney } from '../../lib/money';

// Al marcar como vendido: pide en cuanto se vendio (con el precio actual ya escrito).
// Vacio = se marca vendido sin cambiar el precio.
export function SoldPriceSheet({
  currentPrice,
  onClose,
  onConfirm,
  loading,
}: {
  currentPrice?: number | null;
  onClose: () => void;
  onConfirm: (price: number | null) => void;
  loading: boolean;
}) {
  const { t } = useTranslation();
  const sheetRef = useRef<BottomSheetHandle>(null);
  const [text, setText] = useState(currentPrice != null ? String(currentPrice) : '');

  return (
    <BottomSheet ref={sheetRef} title={t('sold.title')} onClose={onClose}>
      <Input
        label={t('sold.question')}
        value={text}
        onChangeText={setText}
        keyboardType="decimal-pad"
        placeholder="0.00"
      />
      <Text className="text-xs text-slate-400 mt-2">{t('sold.hint')}</Text>
      <View className="flex flex-col mt-5 gap-3">
        <ButtonPill
          label={t('sold.confirm')}
          onPress={() => onConfirm(parseMoney(text))}
          disabled={loading}
        />
        <ButtonPill
          label={t('common.cancel')}
          variant="secondary"
          onPress={() => sheetRef.current?.close()}
        />
      </View>
    </BottomSheet>
  );
}
