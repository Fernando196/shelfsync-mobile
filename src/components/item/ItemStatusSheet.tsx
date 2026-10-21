import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet, BottomSheetHandle } from '../ui/BottomSheet';
import ButtonPill from '../ui/ButtonPill';
import { Text, View } from 'react-native';
import { IInventoryItem } from '../../interfaces/item.interface';
import { formatItemCode } from '../../lib/formatItemCode';
import { ITEM_ACTIONS } from '../../const/itemStatus.const';
import { useItemStatusAction } from '../../hooks/useItemStatusAction';
import { CommentSheet } from './CommentSheet';
import { Package } from 'lucide-react-native';
import { getItemStatus } from '../../lib/statusItem';
import StatusPill from './StatusPill';

export function ItemStatusSheet({
  item,
  onClose,
  onUpdate,
  onViewDetail,
}: {
  item: IInventoryItem;
  onClose: () => void;
  onUpdate: (item: IInventoryItem) => void;
  onViewDetail: () => void;
}) {
  const { t } = useTranslation();
  const sheetRef = useRef<BottomSheetHandle>(null);
  const actions = ITEM_ACTIONS[item.status] ?? [];
  const { changing, handleAction, pendingAction, runAction, cancelComment } = useItemStatusAction(
    item.id,
    onUpdate,
  );

  const status = getItemStatus(item);

  return pendingAction ? (
    <CommentSheet
      title={t('statusSheet.damageReason')}
      onClose={cancelComment}
      onConfirm={(comment) => runAction(pendingAction, comment)}
      loading={changing}
    />
  ) : (
    <BottomSheet
      ref={sheetRef}
      title={t('statusSheet.title', { code: formatItemCode(item.code) })}
      onClose={onClose}
    >
      <View className="flex flex-row items-center bg-slate-200 dark:bg-slate-600 p-3 rounded-md">
        <View className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 items-center justify-center mr-3">
          <Package size={22} color="#64748b" />
        </View>
        <View className="flex-1">
          <View className="flex flex-row justify-between">
            <Text className="text-base font-semibold text-slate-800 dark:text-slate-100 flex-1 mr-2" numberOfLines={2}>
              {item.name || item.productLookup.description || t('reception.noDescription')}
            </Text>
            {status ? <StatusPill label={status.label} tone={status.tone} /> : null}
          </View>
          <Text className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {t('reception.barcode', {
              value: item.productLookup.barcode || t('reception.noBarcode'),
            })}
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {t('reception.sku', { value: item.productLookup.sku || t('reception.noSku') })}
          </Text>
        </View>
      </View>
      <View className="flex flex-col mt-5 gap-3">
        {actions.map((action) => (
          <ButtonPill
            disabled={changing}
            key={action.to}
            onPress={() => handleAction(action)}
            label={action.label}
            variant={action.variant}
          />
        ))}
        <ButtonPill
          disabled={changing}
          onPress={onViewDetail}
          label={t('statusSheet.viewDetail')}
          variant={'secondary'}
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
