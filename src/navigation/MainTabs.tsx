import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import InventoryScreen from '../screens/InventoryScreen';
import CreateProductScreen from '../screens/CreateProductScreen';
import ScannerScreen from '../screens/ScannerScreen';
import SyncQueueScreen from '../screens/SyncQueueScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CustomTabBar from '../components/navigation/CustomTabBar';

export type MainTabParamList = {
  Inventory: undefined;
  CreateProduct: undefined;
  Scanner: undefined;
  SyncQueue: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Inventory" component={InventoryScreen} />
      <Tab.Screen name="CreateProduct" component={CreateProductScreen} />
      <Tab.Screen name="Scanner" component={ScannerScreen} />
      <Tab.Screen name="SyncQueue" component={SyncQueueScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
