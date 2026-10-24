import './global.css';
import './src/i18n';
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { NavigationBar } from 'expo-navigation-bar';
import { loadSavedLanguage } from './src/i18n';

export default function App() {
  // Esperar el idioma guardado para no mostrar un instante el idioma equivocado.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    loadSavedLanguage().finally(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <RootNavigator />
      <NavigationBar style="dark" />
    </SafeAreaProvider>
  );
}
