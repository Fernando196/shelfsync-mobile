import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
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
  return (
    <SessionProvider>
      <InventoryProvider>
        <NavigationContainer>
          <Gate />
        </NavigationContainer>
      </InventoryProvider>
    </SessionProvider>
  );
}
