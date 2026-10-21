import './global.css';
import './src/lib/alertPolyfill';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import AlertHost from './src/components/ui/AlertHost';
import { NavigationBar } from 'expo-navigation-bar';

export default function App() {
  return (
    <SafeAreaProvider>
      <RootNavigator />
      <AlertHost />
      <NavigationBar style="dark" />
    </SafeAreaProvider>
  );
}
