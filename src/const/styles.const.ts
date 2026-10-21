export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export const VARIANT_BUTTON_STYLES: Record<ButtonVariant, { bg: string; text: string }> = {
  primary: {
    bg: 'bg-primary',
    text: 'text-white',
  },
  secondary: {
    bg: 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600',
    text: 'text-slate-700 dark:text-slate-200',
  },
  danger: {
    bg: 'bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800',
    text: 'text-rose-600 dark:text-rose-400',
  },
};
