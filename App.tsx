import './global.css';
import './src/i18n';
import React, { useEffect, useState } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { NavigationBar } from 'expo-navigation-bar';
import { loadSavedLanguage } from './src/i18n';

export default function App() {
  // Esperar el idioma guardado para no mostrar un instante el idioma equivocado.
  const [ready, setReady] = useState(false);
  const scheme = useColorScheme();
  useEffect(() => {
    loadSavedLanguage().finally(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <RootNavigator />
      {/* Iconos de las barras del sistema segun el tema: oscuros en claro y al reves */}
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
      <NavigationBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </SafeAreaProvider>
  );
}
