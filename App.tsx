import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { RootStackParamList } from './src/navigation/types';

// Deep linking configuration
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['mekofix://', 'https://mekofix.app'],
  config: {
    screens: {
      Auth: {
        screens: {
          Welcome: 'welcome',
          Login: 'login',
          CustomerSignup: 'signup/customer',
          MechanicSignup: 'signup/mechanic',
          VendorSignup: 'signup/vendor',
          OTPVerification: 'verify-otp',
          ForgotPassword: 'forgot-password',
        },
      },
      Customer: {
        screens: {
          CustomerTabs: {
            screens: {
              HomeTab: 'home',
              HistoryTab: 'history',
              MarketplaceTab: 'marketplace',
              ProfileTab: 'profile',
            },
          },
        },
      },
      Mechanic: {
        screens: {
          MechanicTabs: {
            screens: {
              HomeTab: 'home',
              RequestsTab: 'requests',
              WalletTab: 'wallet',
              ProfileTab: 'profile',
            },
          },
        },
      },
      Vendor: {
        screens: {
          VendorTabs: {
            screens: {
              ProductsTab: 'products',
              OrdersTab: 'orders',
              WalletTab: 'wallet',
              ProfileTab: 'profile',
            },
          },
        },
      },
    },
  },
};

export default function App() {
  return (
    <NavigationContainer linking={linking}>
      <RootNavigator />
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

