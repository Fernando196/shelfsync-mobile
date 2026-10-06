import { PillTone } from '../components/item/StatusPill';
import { EnumItemStatus } from '../interfaces/enum/itemStatus.type';
import { ButtonVariant } from './styles.const';

export const ITEM_STATUS: Record<EnumItemStatus, { label: string; tone: PillTone }> = {
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
  to: EnumItemStatus;
  needsComment?: boolean;
  variant: ButtonVariant;
};

export const ITEM_ACTIONS: Record<EnumItemStatus, ItemAction[]> = {
  [EnumItemStatus.RECEIVED]: [
    {
      label: 'Requiere ensamble',
      to: EnumItemStatus.PENDING_ASSEMBLY,
      variant: 'secondary',
    },
    {
      label: 'Vendido',
      to: EnumItemStatus.SOLD,
      variant: 'primary',
    },
    {
      label: 'Dañado',
      to: EnumItemStatus.DAMAGED,
      needsComment: true,
      variant: 'danger',
    },
  ],
  [EnumItemStatus.PENDING_ASSEMBLY]: [
    {
      label: 'Iniciar ensamble',
      to: EnumItemStatus.ASSEMBLING,
      variant: 'primary',
    },
    {
      label: 'Dañado',
      to: EnumItemStatus.DAMAGED,
      needsComment: true,
      variant: 'danger',
    },
  ],
  [EnumItemStatus.ASSEMBLING]: [
    {
      label: 'Terminado',
      to: EnumItemStatus.READY,
      variant: 'primary',
    },
    {
      label: 'Pausar',
      to: EnumItemStatus.PAUSED,
      variant: 'secondary',
    },
    {
      label: 'Cancelar ensamble',
      to: EnumItemStatus.PENDING_ASSEMBLY,
      variant: 'secondary',
    },
    {
      label: 'Dañado',
      to: EnumItemStatus.DAMAGED,
      needsComment: true,
      variant: 'danger',
    },
  ],
  [EnumItemStatus.PAUSED]: [
    {
      label: 'Reanudar',
      to: EnumItemStatus.ASSEMBLING,
      variant: 'primary',
    },
    {
      label: 'Cancelar ensamble',
      to: EnumItemStatus.PENDING_ASSEMBLY,
      variant: 'secondary',
    },
    {
      label: 'Dañado',
      to: EnumItemStatus.DAMAGED,
      needsComment: true,
      variant: 'danger',
    },
  ],
  [EnumItemStatus.READY]: [
    {
      label: 'Vendido',
      to: EnumItemStatus.SOLD,
      variant: 'primary',
    },
    {
      label: 'Dañado',
      to: EnumItemStatus.DAMAGED,
      needsComment: true,
      variant: 'danger',
    },
  ],
  [EnumItemStatus.SOLD]: [
    {
      label: 'Dañado',
      to: EnumItemStatus.DAMAGED,
      needsComment: true,
      variant: 'danger',
    },
  ],
  [EnumItemStatus.DAMAGED]: [],
};

export const DETAIL_ON_SCAN = [EnumItemStatus.DAMAGED, EnumItemStatus.SOLD];
