import React from 'react';
import { View, ActivityIndicator, useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SessionProvider, useSession } from '../state/SessionContext';
import { useAutoReconnectPrinter } from '../hooks/useAutoReconnectPrinter';
import LoginScreen from '../screens/auth/LoginScreen';
import MainTabs from './MainTabs';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import EditProductScreen from '../screens/EditProductScreen';
import { useRefreshCategories } from '../hooks/useRefreshCategories';
import { InventoryProvider } from '../state/InventoryContext';
import { COLORS } from '../const/theme.const';

export type RootStackParamList = {
  MainTabs: undefined;
  ItemDetail: { id: string };
  EditProduct: { id: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Fondo de las pantallas durante las transiciones: igual a bg-surface / dark:bg-slate-950,
// si no en modo oscuro se ve un destello blanco al navegar.
const lightTheme: Theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: '#f8fafc' } };
const darkTheme: Theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: '#020617', card: '#0f172a' },
};

function Splash() {
  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-slate-900">
      <ActivityIndicator color={COLORS.primary} />
    </View>
  );
}

function Gate() {
  const { loading, hasToken } = useSession();
  useAutoReconnectPrinter(hasToken);
  useRefreshCategories(hasToken);

  if (loading) return <Splash />;
  if (!hasToken) return <LoginScreen />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      {/* Sin header nativo: cada pantalla pinta su encabezado con BackButton */}
      <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
      <Stack.Screen name="EditProduct" component={EditProductScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const scheme = useColorScheme();
  return (
    <SessionProvider>
      <InventoryProvider>
        <NavigationContainer theme={scheme === 'dark' ? darkTheme : lightTheme}>
          <Gate />
        </NavigationContainer>
      </InventoryProvider>
    </SessionProvider>
  );
}
