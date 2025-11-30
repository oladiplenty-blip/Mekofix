import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../store/authStore';
import { RootStackParamList } from './types';
import { AuthStack } from './AuthStack';
import { CustomerStack } from './CustomerStack';
import { MechanicStack } from './MechanicStack';
import { VendorStack } from './VendorStack';

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  // Debug logging
  React.useEffect(() => {
    console.log('RootNavigator state:', {
      isAuthenticated,
      userType: user?.user_type,
      userId: user?.id,
    });
  }, [isAuthenticated, user]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : (
        <>
          {user?.user_type === 'customer' && (
            <Stack.Screen name="Customer" component={CustomerStack} />
          )}
          {user?.user_type === 'mechanic' && (
            <Stack.Screen name="Mechanic" component={MechanicStack} />
          )}
          {user?.user_type === 'vendor' && (
            <Stack.Screen name="Vendor" component={VendorStack} />
          )}
          {user && !['customer', 'mechanic', 'vendor'].includes(user.user_type) && (
            <Stack.Screen name="Auth" component={AuthStack} />
          )}
        </>
      )}
    </Stack.Navigator>
  );
};

