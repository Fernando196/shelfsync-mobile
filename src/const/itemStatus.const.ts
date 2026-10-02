import { PillTone } from '../components/StatusPill';
import { ItemStatus } from '../interfaces/enum/itemStatus.type';

export const ITEM_STATUS: Record<ItemStatus, { label: string; tone: PillTone }> = {
  received: {
    label: 'Recibido',
    tone: 'neutral',
  },
  pending_assembly: {
    label: 'Por armar',
    tone: 'warning',
  },
  assembling: {
    label: 'Armando',
    tone: 'info',
  },
  ready: {
    label: 'Listo',
    tone: 'success',
  },
  sold: {
    label: 'Vendido',
    tone: 'neutral',
  },
  damaged: {
    label: 'Dañado',
    tone: 'danger',
  },
  paused: {
    label: 'En pausa',
    tone: 'warning',
  },
};
