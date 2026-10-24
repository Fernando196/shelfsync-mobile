import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Share, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check, Copy, Download } from 'lucide-react-native';
import { BottomSheet, BottomSheetHandle } from '../ui/BottomSheet';
import { IInventoryItem } from '../../interfaces/item.interface';
import { buildListing } from '../../lib/marketplaceListing';
import { photoUrl } from '../../services/files.service';
import { canSavePhotos, preparePhotos, PreparedPhotos, savePhotos } from '../../lib/savePhotos';
import { hapticError, hapticSuccess, hapticTap } from '../../lib/haptics';
import { COLORS } from '../../const/theme.const';

interface MarketplaceSheetProps {
  item: IInventoryItem;
  onClose: () => void;
}

// Pasa los datos del producto a Facebook Marketplace a mano: copiar cada campo y
// guardar las fotos originales para subirlas.
export function MarketplaceSheet({ item, onClose }: MarketplaceSheetProps) {
  const { t } = useTranslation();
  const sheetRef = useRef<BottomSheetHandle>(null);
  const listing = useMemo(() => buildListing(item), [item]);
  const [copied, setCopied] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PreparedPhotos | null>(null);
  const [photosError, setPhotosError] = useState(false);
  const urls = useMemo(() => (item.files ?? []).map((f) => photoUrl(f.url)), [item.files]);

  // Las fotos se preparan al abrir para que guardarlas sea inmediato.
  useEffect(() => {
    if (!canSavePhotos || !urls.length) return;
    let active = true;
    preparePhotos(urls)
      .then((p) => active && setPhotos(p))
      .catch(() => active && setPhotosError(true));
    return () => {
      active = false;
    };
  }, [urls]);

  const copy = async (key: string, value: string) => {
    hapticTap();
    // Sin modulo de portapapeles en este build: el menu de compartir de Android
    // trae "Copiar" y tambien deja mandarlo directo a Facebook.
    await Share.share({ message: value });
    setCopied(key);
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
  };

  const handleSave = async () => {
    try {
      await savePhotos(photos ?? []);
      hapticSuccess();
    } catch (e: any) {
      hapticError();
      Alert.alert(t('marketplace.photosFailed'), e?.message ?? String(e));
    }
  };

  const fields = [
    { key: 'title', label: t('marketplace.listingTitle'), value: listing.title },
    { key: 'price', label: t('marketplace.price'), value: listing.price, empty: t('marketplace.noPrice') },
    { key: 'category', label: t('marketplace.category'), value: listing.category },
    { key: 'condition', label: t('marketplace.condition'), value: listing.condition },
    { key: 'description', label: t('marketplace.description'), value: listing.description },
  ];

  const preparing = canSavePhotos && urls.length > 0 && !photos && !photosError;

  return (
    <BottomSheet ref={sheetRef} title={t('marketplace.open')} onClose={onClose}>
      <Text className="text-sm text-slate-500 dark:text-slate-400 mb-3">{t('marketplace.hint')}</Text>

      {fields.map((f) => (
        <View
          key={f.key}
          className="flex-row items-start bg-slate-50 dark:bg-slate-800 rounded-xl p-3 mb-2"
        >
          <View className="flex-1 mr-3">
            <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              {f.label}
            </Text>
            <Text className="text-base text-slate-800 dark:text-slate-100">
              {f.value || f.empty || '-'}
            </Text>
          </View>
          {!!f.value && (
            <Pressable
              onPress={() => copy(f.key, f.value)}
              hitSlop={8}
              className="flex-row items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1.5 active:opacity-70"
            >
              {copied === f.key ? (
                <Check size={14} color={COLORS.accent} />
              ) : (
                <Copy size={14} color={COLORS.primary} />
              )}
              <Text className="text-xs font-semibold text-slate-700 dark:text-slate-200 ml-1">
                {copied === f.key ? t('marketplace.copied') : t('marketplace.copy')}
              </Text>
            </Pressable>
          )}
        </View>
      ))}

      {urls.length === 0 ? (
        <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mt-3">
          {t('marketplace.noPhotos')}
        </Text>
      ) : (
        <Pressable
          onPress={handleSave}
          disabled={preparing || photosError}
          className={`flex-row items-center justify-center bg-accent-600 rounded-xl py-3.5 mt-3 active:opacity-80 ${
            preparing || photosError ? 'opacity-60' : ''
          }`}
        >
          {preparing ? (
            <>
              <ActivityIndicator color="#fff" />
              <Text className="text-white font-semibold ml-2">{t('marketplace.preparingPhotos')}</Text>
            </>
          ) : (
            <>
              <Download size={18} color="#fff" />
              <Text className="text-white font-semibold ml-2">
                {t('marketplace.savePhotos', { count: urls.length })}
              </Text>
            </>
          )}
        </Pressable>
      )}
      {photosError && (
        <Text className="text-sm text-rose-600 dark:text-rose-400 text-center mt-2">
          {t('marketplace.photosFailed')}
        </Text>
      )}
    </BottomSheet>
  );
}
