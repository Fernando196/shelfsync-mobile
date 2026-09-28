import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SessionProvider, useSession } from '../state/SessionContext';
import { useAutoReconnectPrinter } from '../hooks/useAutoReconnectPrinter';
import LoginScreen from '../screens/auth/LoginScreen';
import CreatePinScreen from '../screens/auth/CreatePinScreen';
import PinUnlockScreen from '../screens/auth/PinUnlockScreen';
import MainTabs from './MainTabs';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import EditProductScreen from '../screens/EditProductScreen';
import { useAutoSyncOnReconnect } from '../hooks/useAutoSync';

export type RootStackParamList = {
  MainTabs: undefined;
  ItemDetail: { id: string };
  EditProduct: { id: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function Splash() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator color="#4f46e5" />
    </View>
  );
}

function Gate() {
  const { loading, hasToken, hasPin, unlocked } = useSession();
  useAutoSyncOnReconnect(unlocked);
  useAutoReconnectPrinter(unlocked);

  if (loading) return <Splash />;
  if (!hasToken) return <LoginScreen />;
  if (!hasPin) return <CreatePinScreen />;
  if (!unlocked) return <PinUnlockScreen />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="ItemDetail"
        component={ItemDetailScreen}
        options={{ headerShown: true, title: 'Detalle', headerTintColor: '#4f46e5' }}
      />
      <Stack.Screen
        name="EditProduct"
        component={EditProductScreen}
        options={{ headerShown: true, title: 'Editar', headerTintColor: '#4f46e5' }}
      />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <SessionProvider>
      <NavigationContainer>
        <Gate />
      </NavigationContainer>
    </SessionProvider>
  );
}
