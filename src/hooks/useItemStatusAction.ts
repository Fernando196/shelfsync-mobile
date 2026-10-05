import { useState } from 'react';
import { ItemAction } from '../const/itemStatus.const';
import { InventoryItem } from '../interfaces/item.interface';
import { updateItemStatus } from '../services/items.service';
import { hapticError } from '../lib/haptics';
import { Alert } from 'react-native';

export function useItemStatusAction(itemId: string, onUpdated: (item: InventoryItem) => void) {
  const [changing, setChanging] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<ItemAction | null>(null);

  const handleAction = (action: ItemAction) => {
    if (action.needsComment) setPendingAction(action);
    else runAction(action);
  };

  const runAction = async (action: ItemAction, comment?: string) => {
    setChanging(true);
    try {
      onUpdated(await updateItemStatus(itemId, action.to, comment));
      setPendingAction(null);
    } catch (err: any) {
      hapticError();
      Alert.alert('No se pudo cambiar', err.message);
    } finally {
      setChanging(false);
    }
  };

  const cancelComment = () => setPendingAction(null);

  return {
    // State
    changing,
    pendingAction,

    // Functions
    handleAction,
    runAction,
    cancelComment,
  };
}
