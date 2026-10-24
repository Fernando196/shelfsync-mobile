import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheet, BottomSheetHandle } from '../ui/BottomSheet';
import { IProductLookup } from '../../interfaces/productLookup.interface';
import { useEffect, useState, useRef } from 'react';
import { Input } from '../ui/Input';
import { attachBarcode, searchProductsByCode } from '../../services/productLookup.service';
import { hapticError } from '../../lib/haptics';

export function NotFoundSheet({ code, onClose, onFound, onCreateNew }: NotFoundSheetProps) {
  const { t } = useTranslation();
  const sheetRef = useRef<BottomSheetHandle>(null);
  const [sku, setSku] = useState<string>('');
  const [searching, setSearching] = useState<boolean>(false);
  const [results, setResults] = useState<IProductLookup[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  // Sugerencias mientras se escribe: coincidencias parciales por SKU o codigo de barras.
  useEffect(() => {
    const term = sku.trim();
    if (term.length < 2) {
      setResults([]);
      setLoadingResults(false);
      return;
    }
    let cancelled = false;
    setLoadingResults(true);
    const timer = setTimeout(() => {
      searchProductsByCode(term)
        .then((found) => !cancelled && setResults(found))
        .catch(() => !cancelled && setResults([]))
        .finally(() => !cancelled && setLoadingResults(false));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [sku]);

  const select = async (productLookup: IProductLookup) => {
    // Solo si se escaneo un codigo: se le liga al producto para la proxima vez.
    if (code && !productLookup.barcode) {
      await attachBarcode(productLookup.id, code);
    }
    onFound({ ...productLookup, barcode: productLookup.barcode ?? code ?? null });
  };

  const run = async (fn: () => Promise<void>) => {
    setSearching(true);
    try {
      await fn();
    } catch (err: any) {
      hapticError();
      Alert.alert(t('reception.searchError'), err?.message ?? String(err));
    } finally {
      setSearching(false);
    }
  };

  const term = sku.trim();
  // Sin coincidencias (y ya termino de buscar): se ofrece crear el producto con ese SKU.
  const canCreate = term.length >= 2 && !loadingResults && results.length === 0;

  return (
    <BottomSheet
      ref={sheetRef}
      title={code ? t('reception.productNotFound') : t('reception.searchBySku')}
      onClose={onClose}
    >
      {code ? (
        <View className="flex flex-row">
          <Text className="font-bold text-base text-slate-800 dark:text-slate-100">{t('reception.codeLabel')}</Text>
          <Text className="text-base ml-2 text-slate-800 dark:text-slate-100">{code}</Text>
        </View>
      ) : (
        <Text className="text-sm text-slate-500 dark:text-slate-400">{t('reception.searchBySkuHint')}</Text>
      )}
      <Input
        value={sku}
        onChangeText={(v) => setSku(v)}
        label={t('reception.manifestSku')}
        // SKU puede traer letras: teclado normal, en mayusculas y sin autocorrector.
        autoCapitalize="characters"
        autoCorrect={false}
        autoFocus
        className="mt-4"
      />

      {loadingResults && results.length === 0 ? (
        <ActivityIndicator className="mt-4" />
      ) : canCreate ? (
        <View className="mt-4">
          <Text className="text-sm text-slate-500 dark:text-slate-400 mb-3">
            {t('reception.noMatches')}
          </Text>
          <Pressable
            onPress={() => onCreateNew(term)}
            className="bg-primary-600 dark:bg-slate-600 rounded-xl py-3 items-center active:opacity-80"
          >
            <Text className="text-sm font-semibold text-white">
              {t('reception.createWithSku', { sku: term })}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View className="mt-4">
          {results.map((product) => (
            <Pressable
              key={product.id}
              disabled={searching}
              onPress={() => run(() => select(product))}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mb-2 active:opacity-70"
            >
              <Text className="text-sm font-semibold text-slate-800 dark:text-slate-100" numberOfLines={2}>
                {product.description || t('reception.noDescription')}
              </Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('reception.sku', { value: product.sku || t('reception.noSku') })}
                {product.barcode ? `  ·  ${t('reception.barcode', { value: product.barcode })}` : ''}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <Pressable
        onPress={() => sheetRef.current?.close()}
        className="bg-slate-100 dark:bg-slate-700 rounded-xl py-3 mt-3 items-center"
      >
        <Text className="text-slate-700 dark:text-slate-200 font-semibold text-sm">{t('common.cancel')}</Text>
      </Pressable>
    </BottomSheet>
  );
}

interface NotFoundSheetProps {
  // Codigo escaneado que no se encontro; sin el, es la busqueda manual por SKU
  // (etiqueta danada que no escanea pero se puede leer).
  code?: string;
  onClose: () => void;
  onFound: (product: IProductLookup) => void;
  onCreateNew: (sku: string) => void;
}
