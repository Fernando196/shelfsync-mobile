import { Pressable, Text, View } from 'react-native';
import { BottomSheet, BottomSheetHandle } from '../ui/BottomSheet';
import { IProductLookup } from '../../interfaces/productLookup.interface';
import { useEffect, useState, useRef } from 'react';
import { Input } from '../ui/Input';
import { searchProducts } from '../../services/productLookup.service';
import { normalize } from '../../lib/normalize';

export function NoLabelSheet({ onClose, onCreate, onSelect }: NoLabelSheetProps) {
  const sheetRef = useRef<BottomSheetHandle>(null);
  const [term, setTerm] = useState<string>('');
  const [results, setResults] = useState<IProductLookup[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    if (term.trim().length < 2) {
      setLoading(false);
      setResults([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      searchProducts(term)
        .then((products) => {
          if (!cancelled) setResults(products);
        })
        .catch((err) => {
          console.log(err);
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term]);

  const exactMatch = results.find(
    (p) => !p.barcode && !p.sku && normalize(p.description ?? '') === normalize(term),
  );
  const canCreate = !loading && term.trim().length >= 2 && !exactMatch;

  const header = (
    <Input
      value={term}
      onChangeText={(v) => setTerm(v)}
      label="Descripción del producto"
      autoFocus
      className="mb-4"
    />
  );

  const actions = (
    <View className="flex-row">
      <Pressable
        onPress={() => onCreate(term.trim())}
        className={`flex-1 bg-primary-600  rounded-xl py-3 mr-2 items-center ${!canCreate ? 'opacity-50' : ''}`}
        disabled={!canCreate}
      >
        <Text className="text-white font-semibold text-sm">Crear producto nuevo</Text>
      </Pressable>
      <Pressable
        onPress={() => sheetRef.current?.close()}
        className="flex-1 bg-slate-100 rounded-xl py-3 items-center"
      >
        <Text className="text-slate-700 font-semibold text-sm">Cancelar</Text>
      </Pressable>
    </View>
  );

  return (
    <BottomSheet
      ref={sheetRef}
      title="Caja sin etiqueta"
      header={header}
      footer={actions}
      onClose={onClose}
    >
      {exactMatch && (
        <Text className="text-xs text-slate-500 mb-2">
          Ya existe «{exactMatch.description}», selecciónalo de la lista
        </Text>
      )}
      {term.trim().length >= 2 && !loading && results.length === 0 ? (
        <Text className="text-base text-slate-600">No encontre nada parecido</Text>
      ) : (
        results.map((product) => (
          <Pressable
            key={product.id}
            className={`bg-white border shadow-sm rounded-xl p-3 mb-2 ${product.id === exactMatch?.id ? 'border-primary' : 'border-slate-200'}`}
            onPress={() => onSelect(product)}
          >
            <Text className="text-sm font-semibold text-slate-800">
              {product.description || 'Sin descripción'}
            </Text>
            <Text className="text-xs font-semibold text-slate-500">
              Requiere ensamble: {product.needAssembly ? 'Si' : 'No'}
            </Text>
          </Pressable>
        ))
      )}
    </BottomSheet>
  );
}

interface NoLabelSheetProps {
  onClose: () => void;
  onSelect: (product: IProductLookup) => void;
  onCreate: (description: string) => void;
}
