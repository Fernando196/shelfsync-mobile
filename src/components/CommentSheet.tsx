import { useState } from 'react';
import { BottomSheet } from './ui/BottomSheet';
import { Input } from './ui/Input';
import ButtonPill from './ui/ButtonPill';
import { View } from 'react-native';

export function CommentSheet({
  onClose,
  onConfirm,
  loading,
  title,
}: {
  onClose: () => void;
  onConfirm: (newComment: string) => void;
  loading: boolean;
  title: string;
}) {
  const [comment, setComment] = useState<string>('');
  return (
    <BottomSheet title={title}>
      <Input
        label="Motivo"
        multiline
        textAlignVertical="top"
        value={comment}
        onChangeText={(v) => setComment(v)}
      />
      <View className="flex flex-col mt-5 gap-3">
        <ButtonPill label="Cancelar" variant="secondary" onPress={() => onClose()} />
        <ButtonPill
          label="Confirmar"
          variant="danger"
          onPress={() => onConfirm(comment.trim())}
          disabled={loading || !comment.trim()}
        />
      </View>
    </BottomSheet>
  );
}
