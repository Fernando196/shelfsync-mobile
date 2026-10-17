import { useState, useRef } from 'react';
import { BottomSheet, BottomSheetHandle } from '../ui/BottomSheet';
import { Input } from '../ui/Input';
import ButtonPill from '../ui/ButtonPill';
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
  const sheetRef = useRef<BottomSheetHandle>(null);
  const [comment, setComment] = useState<string>('');
  return (
    <BottomSheet ref={sheetRef} title={title} onClose={onClose}>
      <Input
        label="Motivo"
        multiline
        textAlignVertical="top"
        value={comment}
        onChangeText={(v) => setComment(v)}
      />
      <View className="flex flex-col mt-5 gap-3">
        <ButtonPill
          label="Cancelar"
          variant="secondary"
          onPress={() => sheetRef.current?.close()}
        />
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
