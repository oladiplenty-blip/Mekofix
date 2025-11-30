import React from 'react';
import { Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { CustomerStackParamList, CustomerTabsParamList } from './types';
import { CustomerHomeTab } from '../screens/customer/CustomerHomeTab';
import { CustomerHistoryTab } from '../screens/customer/CustomerHistoryTab';
import { CustomerMarketplaceTab } from '../screens/customer/CustomerMarketplaceTab';
import { CustomerProfileTab } from '../screens/customer/CustomerProfileTab';
import { ServiceRequestScreen } from '../screens/customer/ServiceRequestScreen';
import { RequestTrackingScreen } from '../screens/customer/RequestTrackingScreen';
import { TransactionCompletionScreen } from '../screens/customer/TransactionCompletionScreen';
import { HistoryScreen } from '../screens/customer/HistoryScreen';
import { PaymentsScreen } from '../screens/customer/PaymentsScreen';
import { EditProfileScreen } from '../screens/customer/EditProfileScreen';

const Stack = createStackNavigator<CustomerStackParamList>();
const Tab = createBottomTabNavigator<CustomerTabsParamList>();

const CustomerTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'HistoryTab') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'MarketplaceTab') {
            iconName = focused ? 'storefront' : 'storefront-outline';
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
          paddingBottom: 10,
          paddingTop: 10,
          height: 75,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={CustomerHomeTab}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={CustomerHistoryTab}
        options={{ tabBarLabel: 'History' }}
      />
      <Tab.Screen
        name="MarketplaceTab"
        component={CustomerMarketplaceTab}
        options={{ tabBarLabel: 'Marketplace' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={CustomerProfileTab}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export const CustomerStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CustomerTabs" component={CustomerTabs} />
      <Stack.Screen name="ServiceRequest" component={ServiceRequestScreen} />
      <Stack.Screen name="RequestTracking" component={RequestTrackingScreen} />
      <Stack.Screen
        name="TransactionCompletion"
        component={TransactionCompletionScreen}
      />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="Payments" component={PaymentsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    </Stack.Navigator>
  );
};

