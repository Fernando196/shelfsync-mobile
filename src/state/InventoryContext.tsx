import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { IInventoryItem } from '../interfaces/item.interface';

interface InventoryState {
  items: IInventoryItem[];
  setItems: Dispatch<SetStateAction<IInventoryItem[]>>;
  updateItem: (item: IInventoryItem) => void;
}

const InventoryContext = createContext<InventoryState | null>(null);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<IInventoryItem[]>([]);

  const updateItem = useCallback(
    (item: IInventoryItem) => setItems((prev) => prev.map((i) => (i.id === item.id ? item : i))),
    [],
  );

  const value = useMemo(
    () => ({
      setItems,
      updateItem,
      items,
    }),
    [items, updateItem],
  );

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory(): InventoryState {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory debe usarse dentro de InventoryProvider');
  return ctx;
}
