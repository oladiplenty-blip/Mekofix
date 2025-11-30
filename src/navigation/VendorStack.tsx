import React from 'react';
import { Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { VendorStackParamList, VendorTabsParamList } from './types';
import { VendorProductsTab } from '../screens/vendor/VendorProductsTab';
import { VendorOrdersTab } from '../screens/vendor/VendorOrdersTab';
import { VendorWalletTab } from '../screens/vendor/VendorWalletTab';
import { VendorProfileTab } from '../screens/vendor/VendorProfileTab';

const Stack = createStackNavigator<VendorStackParamList>();
const Tab = createBottomTabNavigator<VendorTabsParamList>();

const VendorTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'ProductsTab') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'OrdersTab') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'WalletTab') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          try {
            return <Ionicons name={iconName as any} size={size} color={color} />;
          } catch (error) {
            // Fallback to a simple text if icon fails
            console.error('Icon rendering error:', error);
            return <Text style={{ color, fontSize: size }}>•</Text>;
          }
        },
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#C6C6C8',
          borderTopWidth: 0.5,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="ProductsTab"
        component={VendorProductsTab}
        options={{ tabBarLabel: 'Products' }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={VendorOrdersTab}
        options={{ tabBarLabel: 'Orders' }}
      />
      <Tab.Screen
        name="WalletTab"
        component={VendorWalletTab}
        options={{ tabBarLabel: 'Wallet' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={VendorProfileTab}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export const VendorStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="VendorTabs" component={VendorTabs} />
    </Stack.Navigator>
  );
};

