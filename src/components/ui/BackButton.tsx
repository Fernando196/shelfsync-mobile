import { Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { COLORS } from '../../const/theme.const';

// Flecha de regreso con el mismo estilo que los botones redondos de Inventario,
// para pantallas sin header nativo.
export function BackButton() {
  const navigation = useNavigation();
  return (
    <Pressable
      onPress={() => navigation.goBack()}
      hitSlop={8}
      className="w-11 h-11 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 items-center justify-center active:opacity-70"
    >
      <ArrowLeft size={20} color={COLORS.primary} />
    </Pressable>
  );
}
