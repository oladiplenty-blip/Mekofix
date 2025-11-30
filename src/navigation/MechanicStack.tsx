import React from 'react';
import { Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MechanicStackParamList, MechanicTabsParamList } from './types';
import { MechanicHomeTab } from '../screens/mechanic/MechanicHomeTab';
import { MechanicRequestsTab } from '../screens/mechanic/MechanicRequestsTab';
import { MechanicWalletTab } from '../screens/mechanic/MechanicWalletTab';
import { MechanicProfileTab } from '../screens/mechanic/MechanicProfileTab';
import { ActiveJobScreen } from '../screens/mechanic/ActiveJobScreen';

const Stack = createStackNavigator<MechanicStackParamList>();
const Tab = createBottomTabNavigator<MechanicTabsParamList>();

const MechanicTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'RequestsTab') {
            iconName = focused ? 'notifications' : 'notifications-outline';
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
        name="HomeTab"
        component={MechanicHomeTab}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="RequestsTab"
        component={MechanicRequestsTab}
        options={{ tabBarLabel: 'Requests' }}
      />
      <Tab.Screen
        name="WalletTab"
        component={MechanicWalletTab}
        options={{ tabBarLabel: 'Wallet' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={MechanicProfileTab}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export const MechanicStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MechanicTabs" component={MechanicTabs} />
      <Stack.Screen name="ActiveJob" component={ActiveJobScreen} />
    </Stack.Navigator>
  );
};

