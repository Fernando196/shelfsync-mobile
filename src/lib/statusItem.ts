import { ITEM_STATUS } from '../const/itemStatus.const';
import { IInventoryItem } from '../interfaces/item.interface';

export function getItemStatus(item: IInventoryItem) {
  return ITEM_STATUS[item.status] ?? ITEM_STATUS.received;
}
