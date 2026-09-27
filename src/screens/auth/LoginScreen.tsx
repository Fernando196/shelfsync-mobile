import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Warehouse } from 'lucide-react-native';
import { saveAccessToken, saveProfileFromUser } from '../../lib/auth';
import { useSession } from '../../state/SessionContext';
import { hapticError, hapticSuccess } from '../../lib/haptics';
import { login } from '../../services/auth.service';

export default function LoginScreen() {
  const { refreshToken, refreshProfile } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Faltan datos', 'Ingresa tu correo y contrasena.');
      return;
    }
    setLoading(true);
    try {
      const res = await login(email.trim(), password);
      await saveAccessToken(res.accessToken);
      await saveProfileFromUser(res.user);
      hapticSuccess();
      await Promise.all([refreshToken(), refreshProfile()]);
    } catch (e: any) {
      hapticError();
      Alert.alert('No se pudo iniciar sesion', e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white"
    >
      <View className="flex-1 px-6 justify-center">
        <View className="items-center mb-10">
          <View className="w-16 h-16 rounded-2xl bg-primary-600 items-center justify-center mb-4">
            <Warehouse size={28} color="#fff" />
          </View>
          <Text className="text-2xl font-bold text-slate-800">Iniciar sesion</Text>
          <Text className="text-slate-400 mt-1 text-center">
            Solo se pide una vez por dispositivo. Despues desbloqueas con tu PIN.
          </Text>
        </View>

        <Text className="text-xs font-semibold text-slate-500 mb-1">Correo</Text>
        <TextInput
          className="border border-slate-200 rounded-xl px-4 py-3 mb-4 text-base"
          value={email}
          onChangeText={setEmail}
          placeholder="operario@bodega.com"
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />

        <Text className="text-xs font-semibold text-slate-500 mb-1">Contrasena</Text>
        <TextInput
          className="border border-slate-200 rounded-xl px-4 py-3 mb-6 text-base"
          value={password}
          onChangeText={setPassword}
          placeholder="********"
          secureTextEntry
          editable={!loading}
        />

        <Pressable
          onPress={handleLogin}
          disabled={loading}
          className="bg-primary-600 rounded-xl py-4 items-center active:scale-95"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-base">Entrar</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
