import { PillTone } from '../components/item/StatusPill';
import { ItemStatus } from '../interfaces/enum/itemStatus.type';
import { ButtonVariant } from './styles.const';

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

export type ItemAction = {
  label: string;
  to: ItemStatus;
  needsComment?: boolean;
  variant: ButtonVariant;
};

export const ITEM_ACTIONS: Record<ItemStatus, ItemAction[]> = {
  [ItemStatus.RECEIVED]: [
    {
      label: 'Requiere ensamble',
      to: ItemStatus.PENDING_ASSEMBLY,
      variant: 'secondary',
    },
    {
      label: 'Vendido',
      to: ItemStatus.SOLD,
      variant: 'primary',
    },
    {
      label: 'Dañado',
      to: ItemStatus.DAMAGED,
      needsComment: true,
      variant: 'danger',
    },
  ],
  [ItemStatus.PENDING_ASSEMBLY]: [
    {
      label: 'Iniciar ensamble',
      to: ItemStatus.ASSEMBLING,
      variant: 'primary',
    },
    {
      label: 'Dañado',
      to: ItemStatus.DAMAGED,
      needsComment: true,
      variant: 'danger',
    },
  ],
  [ItemStatus.ASSEMBLING]: [
    {
      label: 'Terminado',
      to: ItemStatus.READY,
      variant: 'primary',
    },
    {
      label: 'Pausar',
      to: ItemStatus.PAUSED,
      variant: 'secondary',
    },
    {
      label: 'Cancelar ensamble',
      to: ItemStatus.PENDING_ASSEMBLY,
      variant: 'secondary',
    },
    {
      label: 'Dañado',
      to: ItemStatus.DAMAGED,
      needsComment: true,
      variant: 'danger',
    },
  ],
  [ItemStatus.PAUSED]: [
    {
      label: 'Reanudar',
      to: ItemStatus.ASSEMBLING,
      variant: 'primary',
    },
    {
      label: 'Cancelar ensamble',
      to: ItemStatus.PENDING_ASSEMBLY,
      variant: 'secondary',
    },
    {
      label: 'Dañado',
      to: ItemStatus.DAMAGED,
      needsComment: true,
      variant: 'danger',
    },
  ],
  [ItemStatus.READY]: [
    {
      label: 'Vendido',
      to: ItemStatus.SOLD,
      variant: 'primary',
    },
    {
      label: 'Dañado',
      to: ItemStatus.DAMAGED,
      needsComment: true,
      variant: 'danger',
    },
  ],
  [ItemStatus.SOLD]: [
    {
      label: 'Dañado',
      to: ItemStatus.DAMAGED,
      needsComment: true,
      variant: 'danger',
    },
  ],
  [ItemStatus.DAMAGED]: [],
};

export const DETAIL_ON_SCAN = [ItemStatus.DAMAGED, ItemStatus.SOLD];
