import { ITEM_STATUS } from '../const/itemStatus.const';
import { InventoryItem } from '../interfaces/item.interface';

export function getItemStatus(item: InventoryItem) {
  return ITEM_STATUS[item.status] ?? ITEM_STATUS.received;
}
