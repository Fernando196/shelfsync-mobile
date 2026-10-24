import { ReactNode, Ref, useEffect, useImperativeHandle, useRef } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  PanResponder,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Distancia (px) o velocidad hacia abajo a partir de la cual soltar cierra el sheet.
const CLOSE_DISTANCE = 120;
const CLOSE_VELOCITY = 1;

export interface BottomSheetHandle {
  // Baja el sheet animado y al terminar llama a onClose.
  close: () => void;
}

interface BottomSheetProps {
  title: string;
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  ref?: Ref<BottomSheetHandle>;
}

export function BottomSheet({ title, header, children, footer, onClose, ref }: BottomSheetProps) {
  const scheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get('window').height;
  const translateY = useRef(new Animated.Value(screenHeight)).current;

  // El PanResponder se crea una sola vez; el ref evita que use un onClose viejo.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const closingRef = useRef(false);
  const close = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onCloseRef.current());
  };

  useImperativeHandle(ref, () => ({ close }));

  useEffect(() => {
    Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }).start();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > CLOSE_DISTANCE || g.vy > CLOSE_VELOCITY) {
          close();
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    }),
  ).current;

  return (
    // Layout via style, not className: on web NativeWind drops className on these two,
    // which left the sheet unpositioned (pushing the camera) and without background.
    <KeyboardAvoidingView
      pointerEvents="box-none"
      behavior="padding"
      style={{
        position: 'absolute',
        top: insets.top + 20,
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: 'flex-end',
        // Clip the sheet while it is translated off screen; on web it would otherwise
        // grow the page and make Safari scroll the camera behind it.
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={{
          // En style (no className): NativeWind no aplica clases a Animated.View en web.
          backgroundColor: scheme === 'dark' ? '#0f172a' : '#ffffff',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 20,
          paddingBottom: 40,
          flexShrink: 1,
          transform: [{ translateY }],
        }}
      >
        <View className="pt-5" {...panResponder.panHandlers}>
          <View className="self-center w-10 h-1 rounded-full bg-slate-300 mb-4" />
          <Text className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3">{title}</Text>
        </View>
        {header && <View>{header}</View>}
        <ScrollView style={{ flexShrink: 1 }} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
        {footer && <View className="pt-3">{footer}</View>}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}
