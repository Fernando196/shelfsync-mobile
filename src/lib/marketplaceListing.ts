import i18n from '../i18n';
import { IInventoryItem } from '../interfaces/item.interface';

export interface IMarketplaceListing {
  title: string;
  price: string;
  category: string;
  condition: string;
  description: string;
}

/**
 * Datos listos para copiar a Facebook Marketplace, en el idioma actual de la app.
 * La descripcion se arma con lo que ya tenemos; mas adelante la puede redactar una IA.
 */
export function buildListing(item: IInventoryItem): IMarketplaceListing {
  const title = item.name || item.productLookup?.description || '';
  const condition = i18n.t(`conditions.${item.condition ?? 'new'}`);
  const category = item.category?.name ?? '';
  const manifest = item.productLookup?.description?.trim();
  const notes = item.notes?.trim();
  const sku = item.productLookup?.sku;

  const lines = [title, '', i18n.t('marketplace.descCondition', { value: condition })];
  if (category) lines.push(i18n.t('marketplace.descCategory', { value: category }));
  if (manifest && manifest !== title) lines.push('', manifest);
  if (notes) lines.push('', i18n.t('marketplace.descDetails', { value: notes }));
  lines.push('', i18n.t('marketplace.descQty', { count: item.qty }));
  if (sku) lines.push(i18n.t('marketplace.descRef', { value: sku }));

  return {
    title,
    price: item.price != null ? String(item.price) : '',
    category,
    condition,
    description: lines.join('\n'),
  };
}
