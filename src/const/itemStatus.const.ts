import { PillTone } from '../components/item/StatusPill';
import { EnumItemStatus } from '../interfaces/enum/itemStatus.type';
import { ButtonVariant } from './styles.const';
import i18n from '../i18n';
import es from '../i18n/locales/es';

type ActionKey = keyof typeof es.actions;

// `label` es un getter: se traduce al leerlo, asi todos los usos siguen el idioma actual.
function status(key: EnumItemStatus, tone: PillTone) {
  return {
    get label() {
      return i18n.t(`status.${key}`);
    },
    tone,
  };
}

function action(
  key: ActionKey,
  to: EnumItemStatus,
  variant: ButtonVariant,
  needsComment?: boolean,
): ItemAction {
  return {
    get label() {
      return i18n.t(`actions.${key}`);
    },
    to,
    variant,
    needsComment,
  };
}

export const ITEM_STATUS: Record<EnumItemStatus, { label: string; tone: PillTone }> = {
  received: status(EnumItemStatus.RECEIVED, 'neutral'),
  pending_assembly: status(EnumItemStatus.PENDING_ASSEMBLY, 'warning'),
  assembling: status(EnumItemStatus.ASSEMBLING, 'info'),
  ready: status(EnumItemStatus.READY, 'success'),
  sold: status(EnumItemStatus.SOLD, 'neutral'),
  damaged: status(EnumItemStatus.DAMAGED, 'danger'),
  paused: status(EnumItemStatus.PAUSED, 'warning'),
};

export type ItemAction = {
  readonly label: string;
  to: EnumItemStatus;
  needsComment?: boolean;
  variant: ButtonVariant;
};

const damaged = () => action('damaged', EnumItemStatus.DAMAGED, 'danger', true);

export const ITEM_ACTIONS: Record<EnumItemStatus, ItemAction[]> = {
  [EnumItemStatus.RECEIVED]: [
    action('requiresAssembly', EnumItemStatus.PENDING_ASSEMBLY, 'secondary'),
    action('sold', EnumItemStatus.SOLD, 'primary'),
    damaged(),
  ],
  [EnumItemStatus.PENDING_ASSEMBLY]: [
    action('startAssembly', EnumItemStatus.ASSEMBLING, 'primary'),
    damaged(),
  ],
  [EnumItemStatus.ASSEMBLING]: [
    action('finished', EnumItemStatus.READY, 'primary'),
    action('pause', EnumItemStatus.PAUSED, 'secondary'),
    action('cancelAssembly', EnumItemStatus.PENDING_ASSEMBLY, 'secondary'),
    damaged(),
  ],
  [EnumItemStatus.PAUSED]: [
    action('resume', EnumItemStatus.ASSEMBLING, 'primary'),
    action('cancelAssembly', EnumItemStatus.PENDING_ASSEMBLY, 'secondary'),
    damaged(),
  ],
  [EnumItemStatus.READY]: [action('sold', EnumItemStatus.SOLD, 'primary'), damaged()],
  [EnumItemStatus.SOLD]: [damaged()],
  [EnumItemStatus.DAMAGED]: [],
};

export const DETAIL_ON_SCAN = [EnumItemStatus.DAMAGED, EnumItemStatus.SOLD];
