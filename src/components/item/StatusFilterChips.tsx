import { Pressable, ScrollView, Text, View } from 'react-native';
import { ITEM_STATUS } from '../../const/itemStatus.const';
import { EnumItemStatus } from '../../interfaces/enum/itemStatus.type';
import { IItemStatusCounts } from '../../interfaces/item.interface';
import { TONE_STYLES } from './StatusPill';
import { useTranslation } from 'react-i18next';

interface StatusFilterChipsProps {
  // null = Todos.
  selected: EnumItemStatus | null;
  counts: IItemStatusCounts | null;
  onChange: (status: EnumItemStatus | null) => void;
}

const STATUSES = Object.keys(ITEM_STATUS) as EnumItemStatus[];

export function StatusFilterChips({ selected, counts, onChange }: StatusFilterChipsProps) {
  const { t } = useTranslation();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mt-4 -mx-5"
      contentContainerStyle={{ paddingHorizontal: 20 }}
    >
      <Chip
        label={t('inventory.all')}
        count={counts?.total}
        active={selected === null}
        onPress={() => onChange(null)}
      />
      {STATUSES.map((status) => (
        <Chip
          key={status}
          status={status}
          label={ITEM_STATUS[status].label}
          count={counts?.counts[status]}
          active={selected === status}
          onPress={() => onChange(selected === status ? null : status)}
        />
      ))}
    </ScrollView>
  );
}

function Chip({
  status,
  label,
  count,
  active,
  onPress,
}: {
  status?: EnumItemStatus;
  label: string;
  count?: number;
  active: boolean;
  onPress: () => void;
}) {
  const tone = TONE_STYLES[status ? ITEM_STATUS[status].tone : 'neutral'];
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center px-3 py-1.5 mr-2 rounded-full border active:opacity-70 ${
        active ? `${tone.bg} border-primary-600` : 'bg-white border-slate-200'
      }`}
    >
      {status && <View className={`w-2 h-2 rounded-full mr-2 ${tone.dot}`} />}
      <Text className={`text-xs font-semibold ${active ? tone.text : 'text-slate-600'}`}>
        {label}
      </Text>
      {count !== undefined && (
        <Text className={`text-xs ml-1.5 ${active ? tone.text : 'text-slate-400'}`}>{count}</Text>
      )}
    </Pressable>
  );
}
