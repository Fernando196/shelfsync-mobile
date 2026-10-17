import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { IInventoryItem } from '../interfaces/item.interface';
import { useSession } from './SessionContext';

interface InventoryState {
  items: IInventoryItem[];
  setItems: Dispatch<SetStateAction<IInventoryItem[]>>;
  updateItem: (item: IInventoryItem) => void;
  total: number;
  setTotal: Dispatch<SetStateAction<number>>;
  removeItem: (id: string) => void;
  addItem: (item: IInventoryItem) => void;
}

const InventoryContext = createContext<InventoryState | null>(null);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<IInventoryItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const { hasToken } = useSession();

  useEffect(() => {
    if (hasToken) return;
    setItems([]);
    setTotal(0);
  }, [hasToken]);

  const updateItem = useCallback(
    (item: IInventoryItem) => setItems((prev) => prev.map((i) => (i.id === item.id ? item : i))),
    [],
  );

  const addItem = useCallback((item: IInventoryItem) => {
    setItems((prev) => [item, ...prev]);
    setTotal((prev) => prev + 1);
  }, []);

  const removeItem = useCallback(
    (id: string) => {
      const exist = items.find((i) => i.id === id);
      if (!exist) return;
      setItems((prev) => prev.filter((p) => p.id !== id));
      setTotal((prev) => prev - 1);
    },
    [items],
  );

  const value = useMemo(
    () => ({
      setItems,
      updateItem,
      items,
      total,
      setTotal,
      removeItem,
      addItem,
    }),
    [items, updateItem, total, removeItem, addItem],
  );

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory(): InventoryState {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory debe usarse dentro de InventoryProvider');
  return ctx;
}
