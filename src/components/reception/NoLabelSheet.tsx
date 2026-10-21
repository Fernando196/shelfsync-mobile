import { Platform, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheet, BottomSheetHandle } from '../ui/BottomSheet';
import { IProductLookup } from '../../interfaces/productLookup.interface';
import { useEffect, useState, useRef } from 'react';
import { Input } from '../ui/Input';
import { searchProducts } from '../../services/productLookup.service';
import { normalize } from '../../lib/normalize';

export function NoLabelSheet({ onClose, onCreate, onSelect }: NoLabelSheetProps) {
  const { t } = useTranslation();
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
      label={t('reception.productDescription')}
      // En web (iOS) el foco con el sheet aun fuera de pantalla hace que Safari desplace la pagina
      autoFocus={Platform.OS !== 'web'}
      className="mb-4"
    />
  );

  const actions = (
    <Pressable
      onPress={() => sheetRef.current?.close()}
      className="bg-slate-100 dark:bg-slate-700 rounded-xl py-3 items-center"
    >
      <Text className="text-slate-700 dark:text-slate-200 font-semibold text-sm">{t('common.cancel')}</Text>
    </Pressable>
  );

  return (
    <BottomSheet
      ref={sheetRef}
      title={t('reception.noLabelTitle')}
      header={header}
      footer={actions}
      onClose={onClose}
    >
      {/* Crear va arriba de los resultados: con descripciones, que haya parecidos no
          significa que ya exista; solo se oculta si hay uno con la misma descripcion. */}
      {canCreate && (
        <Pressable
          onPress={() => onCreate(term.trim())}
          className="bg-primary-600 dark:bg-slate-600 rounded-xl py-3 px-4 mb-3 items-center active:opacity-80"
        >
          <Text className="text-white font-semibold text-sm" numberOfLines={1}>
            {t('reception.createWithDescription', { description: term.trim() })}
          </Text>
        </Pressable>
      )}
      {exactMatch && (
        <Text className="text-xs text-slate-500 dark:text-slate-400 mb-2">
          {t('reception.alreadyExists', { description: exactMatch.description })}
        </Text>
      )}
      {term.trim().length >= 2 && !loading && results.length === 0 ? (
        <Text className="text-base text-slate-600 dark:text-slate-300">{t('reception.noMatches')}</Text>
      ) : (
        results.map((product) => (
          <Pressable
            key={product.id}
            className={`bg-white dark:bg-slate-900 border shadow-sm web:shadow-none rounded-xl p-3 mb-2 ${product.id === exactMatch?.id ? 'border-primary' : 'border-slate-200 dark:border-slate-700'}`}
            onPress={() => onSelect(product)}
          >
            <Text className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {product.description || t('reception.noDescription')}
            </Text>
            <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t('reception.needsAssembly', {
                value: product.needAssembly ? t('common.yes') : t('common.no'),
              })}
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
