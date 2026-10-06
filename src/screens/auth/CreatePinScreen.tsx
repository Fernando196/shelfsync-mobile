import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { Warehouse } from 'lucide-react-native';
import { setPin as savePin } from '../../lib/auth';
import { useSession } from '../../state/SessionContext';
import { hapticError } from '../../lib/haptics';
import PinKeypad from '../../components/auth/PinKeypad';

const PIN_LENGTH = 6;

export default function CreatePinScreen() {
  const { profile, refreshPin, unlock } = useSession();
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [firstPin, setFirstPin] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);

  const onPinChange = async (next: string) => {
    setError(false);
    if (step === 'create') {
      setPin(next);
      if (next.length === PIN_LENGTH) {
        setFirstPin(next);
        setPin('');
        setStep('confirm');
      }
      return;
    }

    setPin(next);
    if (next.length === PIN_LENGTH) {
      if (next !== firstPin) {
        hapticError();
        setError(true);
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 400);
        return;
      }
      setSaving(true);
      try {
        await savePin(next);
        await refreshPin();
        unlock();
      } catch (e: any) {
        Alert.alert('No se pudo guardar', e?.message ?? String(e));
        setSaving(false);
      }
    }
  };

  return (
    <View className="flex-1 bg-white px-6 pt-20">
      <View className="items-center mb-10">
        <View className="w-16 h-16 rounded-2xl bg-primary-600 items-center justify-center mb-4">
          <Warehouse size={28} color="#fff" />
        </View>
        <Text className="text-2xl font-bold text-slate-800">
          {step === 'create' ? 'Crea tu PIN' : 'Confirma tu PIN'}
        </Text>
        <Text className="text-slate-400 mt-1 text-center">
          {step === 'create'
            ? `Hola${profile?.fullName ? `, ${profile.fullName.split(' ')[0]}` : ''}. Elige ${PIN_LENGTH} digitos para desbloquear la app sin volver a iniciar sesion.`
            : 'Ingresa el mismo PIN otra vez'}
        </Text>
      </View>

      <PinKeypad
        value={pin}
        length={PIN_LENGTH}
        onChange={onPinChange}
        error={error}
        disabled={saving}
      />
    </View>
  );
}
