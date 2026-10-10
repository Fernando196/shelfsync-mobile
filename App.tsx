import './global.css';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { NavigationBar } from 'expo-navigation-bar';

export default function App() {
  return (
    <SafeAreaProvider>
      <RootNavigator />
      <NavigationBar style="dark" />
    </SafeAreaProvider>
  );
}
