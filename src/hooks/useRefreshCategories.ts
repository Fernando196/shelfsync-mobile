import { useEffect } from 'react';
import { refreshCategories } from '../lib/categoryCatalog';

export function useRefreshCategories(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    refreshCategories();
  }, [enabled]);
}
