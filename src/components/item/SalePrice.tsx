import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check, Pencil, Plus, X } from 'lucide-react-native';
import { IInventoryItem } from '../../interfaces/item.interface';
import { updateItem } from '../../services/items.service';
import { formatMoney, parseMoney } from '../../lib/money';
import { hapticError, hapticSuccess, hapticTap } from '../../lib/haptics';
import { COLORS } from '../../const/theme.const';

interface SalePriceProps {
  item: IInventoryItem;
  onSaved: (item: IInventoryItem) => void;
}

// Precio de venta del detalle, editable ahi mismo para no tener que ir a Editar.
// Debajo: costo de bodega y ganancia (solo lectura).
export function SalePrice({ item, onSaved }: SalePriceProps) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    hapticTap();
    setText(item.price != null ? String(item.price) : '');
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      onSaved(await updateItem(item.id, { price: parseMoney(text) }));
      hapticSuccess();
      setEditing(false);
    } catch (e: any) {
      hapticError();
      Alert.alert(t('pricing.saveFailed'), e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="mt-3">
      {editing ? (
        <View className="flex-row items-center">
          <View className="flex-1 flex-row items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3">
            <Text className="text-lg font-bold text-slate-500 dark:text-slate-400">$</Text>
            <TextInput
              value={text}
              onChangeText={setText}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#94a3b8"
              autoFocus
              onSubmitEditing={save}
              className="flex-1 py-2.5 px-2 text-lg font-bold text-slate-800 dark:text-slate-100"
            />
          </View>
          <Pressable
            onPress={save}
            disabled={saving}
            hitSlop={6}
            className="w-11 h-11 ml-2 rounded-full bg-accent-600 items-center justify-center active:opacity-80"
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Check size={20} color="#fff" />}
          </Pressable>
          <Pressable
            onPress={() => setEditing(false)}
            disabled={saving}
            hitSlop={6}
            className="w-11 h-11 ml-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 items-center justify-center active:opacity-70"
          >
            <X size={20} color={COLORS.primary} />
          </Pressable>
        </View>
      ) : item.price != null ? (
        <Pressable onPress={startEdit} className="flex-row items-center self-start active:opacity-70">
          <Text className="text-3xl font-bold text-accent-600 dark:text-emerald-400">
            {formatMoney(item.price)}
          </Text>
          <Pencil size={16} color="#94a3b8" style={{ marginLeft: 8 }} />
        </Pressable>
      ) : (
        <Pressable
          onPress={startEdit}
          className="flex-row items-center self-start border border-dashed border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 active:opacity-70"
        >
          <Plus size={16} color={COLORS.primary} />
          <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200 ml-1.5">
            {t('pricing.addSalePrice')}
          </Text>
        </Pressable>
      )}

      {item.cost != null && !editing && (
        <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t('pricing.costLine', { value: formatMoney(item.cost) })}
          {item.price != null
            ? `  ·  ${t('pricing.margin', { value: formatMoney(item.price - item.cost) })}`
            : ''}
        </Text>
      )}
    </View>
  );
}
