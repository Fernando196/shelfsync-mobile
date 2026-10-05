export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export const VARIANT_BUTTON_STYLES: Record<ButtonVariant, { bg: string; text: string }> = {
  primary: {
    bg: 'bg-primary',
    text: 'text-white',
  },
  secondary: {
    bg: 'bg-white border border-slate-300',
    text: 'text-slate-700',
  },
  danger: {
    bg: 'bg-white border border-rose-300',
    text: 'text-rose-600',
  },
};
