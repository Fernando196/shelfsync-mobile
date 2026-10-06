import { InventoryTicketData } from './../printing/escpos';
import { IInventoryItem } from '../interfaces/item.interface';
import { formatItemCode } from './formatItemCode';

export function toTicket(
  item: Pick<IInventoryItem, 'id' | 'name' | 'qty' | 'location' | 'code'>,
): InventoryTicketData {
  return {
    id: item.id,
    name: item.name || '',
    qty: item.qty,
    location: item.location || '',
    code: formatItemCode(item.code),
  };
}
