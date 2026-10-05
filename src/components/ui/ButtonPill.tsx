import { Text, Pressable } from 'react-native';
import { ButtonVariant, VARIANT_BUTTON_STYLES } from '../../const/styles.const';

export default function ButtonPill({
  label,
  variant = 'primary',
  onPress,
  disabled,
}: {
  label: string;
  variant?: ButtonVariant;
  onPress: () => void;
  disabled?: boolean;
}) {
  const s = VARIANT_BUTTON_STYLES[variant];
  return (
    <Pressable
      disabled={disabled}
      className={`w-full items-center py-3 rounded-md my-2 ${s.bg} ${disabled ? 'opacity-50' : ''}`}
      onPress={() => onPress()}
    >
      <Text className={` text-base font-semibold ${s.text}`}>{label}</Text>
    </Pressable>
  );
}
