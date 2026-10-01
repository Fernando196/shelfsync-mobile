import { Text, TextInput, TextInputProps, View } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, multiline, className, ...rest }: InputProps) {
  return (
    <View className={className}>
      {label ? <Text className="text-sm font-semibold text-slate-500">{label}</Text> : null}
      <TextInput
        {...rest}
        multiline={multiline}
        className={
          'mt-3 border rounded-xl px-4 py-3 text-base text-slate-800 ' +
          (error ? 'border-red-500' : 'border-slate-300') +
          ' ' +
          (multiline ? 'h-24' : '')
        }
        placeholderTextColor="#94a3b8"
      />
      {error ? <Text className="text-sm text-red-500 mt-4">{error}</Text> : null}
    </View>
  );
}
