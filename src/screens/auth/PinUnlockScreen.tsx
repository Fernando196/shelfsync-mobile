import React, { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { Warehouse } from 'lucide-react-native';
import { verifyPin, resetSession } from '../../lib/auth';
import { useSession } from '../../state/SessionContext';
import { hapticError } from '../../lib/haptics';
import PinKeypad from '../../components/auth/PinKeypad';

const PIN_LENGTH = 6;

export default function PinUnlockScreen() {
  const { profile, unlock, resetSession: resetLocalSession } = useSession();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  const onPinChange = async (next: string) => {
    setError(false);
    setPin(next);
    if (next.length !== PIN_LENGTH) return;

    setChecking(true);
    const ok = await verifyPin(next);
    setChecking(false);

    if (ok) {
      unlock();
    } else {
      hapticError();
      setError(true);
      setTimeout(() => {
        setPin('');
        setError(false);
      }, 400);
    }
  };

  const handleForgotPin = () => {
    Alert.alert(
      'Reiniciar sesion',
      'Se borrara tu PIN, tu sesion y tu perfil local de este dispositivo. Tendras que iniciar sesion otra vez. El inventario ya sincronizado no se pierde.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Reiniciar', style: 'destructive', onPress: () => resetLocalSession() },
      ],
    );
  };

  return (
    <View className="flex-1 bg-white px-6 pt-20">
      <View className="items-center mb-10">
        <View className="w-16 h-16 rounded-2xl bg-primary-600 items-center justify-center mb-4">
          <Warehouse size={28} color="#fff" />
        </View>
        <Text className="text-2xl font-bold text-slate-800">
          Hola, {profile?.fullName?.split(' ')[0] ?? profile?.email?.split('@')[0] ?? 'operario'}
        </Text>
        <Text className="text-slate-400 mt-1">Ingresa tu PIN para continuar</Text>
      </View>

      <PinKeypad
        value={pin}
        length={PIN_LENGTH}
        onChange={onPinChange}
        error={error}
        disabled={checking}
      />

      <Pressable onPress={handleForgotPin} className="mt-10 items-center active:scale-95">
        <Text className="text-primary-600 font-medium">Olvide mi PIN / Reiniciar sesion</Text>
      </Pressable>
    </View>
  );
}
