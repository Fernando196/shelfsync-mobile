import { BottomSheet } from './ui/BottomSheet';
import ButtonPill from './ui/ButtonPill';
import { Text, View } from 'react-native';
import { InventoryItem } from '../interfaces/item.interface';
import { formatItemCode } from '../lib/formatItemCode';
import { ITEM_ACTIONS } from '../const/itemStatus.const';
import { useItemStatusAction } from '../hooks/useItemStatusAction';
import { CommentSheet } from './CommentSheet';
import { Package } from 'lucide-react-native';
import { getItemStatus } from '../lib/statusItem';
import StatusPill from './StatusPill';

export function ItemStatusSheet({
  item,
  onClose,
  onUpdate,
  onViewDetail,
}: {
  item: InventoryItem;
  onClose: () => void;
  onUpdate: (item: InventoryItem) => void;
  onViewDetail: () => void;
}) {
  const actions = ITEM_ACTIONS[item.status] ?? [];
  const { changing, handleAction, pendingAction, runAction, cancelComment } = useItemStatusAction(
    item.id,
    onUpdate,
  );

  const status = getItemStatus(item);

  return pendingAction ? (
    <CommentSheet
      title="Motivo del daño"
      onClose={cancelComment}
      onConfirm={(comment) => runAction(pendingAction, comment)}
      loading={changing}
    />
  ) : (
    <BottomSheet title={`Cambiar estatus de la caja ${formatItemCode(item.code)}`}>
      <View className="flex flex-row items-center bg-slate-200 p-3 rounded-md">
        <View className="w-12 h-12 rounded-xl bg-slate-100 items-center justify-center mr-3">
          <Package size={22} color="#64748b" />
        </View>
        <View className="flex-1">
          <View className="flex flex-row justify-between">
            <Text className="text-base font-semibold text-slate-800 flex-1 mr-2" numberOfLines={2}>
              {item.name || item.productLookup.description || 'Sin descripción'}
            </Text>
            {status ? <StatusPill label={status.label} tone={status.tone} /> : null}
          </View>
          <Text className="text-slate-500 text-sm mt-0.5">
            Barcode: {item.productLookup.barcode || 'Sin codigo de barras'}
          </Text>
          <Text className="text-slate-500 text-sm mt-0.5">
            SKU: {item.productLookup.sku || 'Sin sku'}
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
          label={'Ver detalle'}
          variant={'secondary'}
        />
        <ButtonPill label="Cancelar" variant="secondary" onPress={() => onClose()} />
      </View>
    </BottomSheet>
  );
}
