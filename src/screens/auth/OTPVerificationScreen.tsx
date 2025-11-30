import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Button, OTPInput } from '../../components/common';
import { authService } from '../../services/authService';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuthStore } from '../../store/authStore';
import * as Location from 'expo-location';
import { AuthStackParamList, RootStackParamList } from '../../navigation/types';

type OTPVerificationScreenRouteProp = RouteProp<
  AuthStackParamList,
  'OTPVerification'
>;
type OTPVerificationScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'OTPVerification'
>;
type RootNavigationProp = StackNavigationProp<RootStackParamList>;

export const OTPVerificationScreen: React.FC = () => {
  const navigation = useNavigation<OTPVerificationScreenNavigationProp & RootNavigationProp>();
  const route = useRoute<OTPVerificationScreenRouteProp>();
  const { email, phone } = route.params || {};
  const { login } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerifyOTP = async (code: string) => {
    try {
      setLoading(true);
      setError(undefined);
      const response = await authService.verifyOTP({
        email,
        phone,
        code,
      });

      if (response.success && response.data) {
        console.log('OTP verification successful:', {
          user: response.data.user,
          hasToken: !!response.data.token,
        });

        // Store auth data
        login(response.data.user, response.data.token);

        // Request location permission
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            // Permission granted, continue
          }
        } catch (locationError) {
          // Continue even if location permission is denied
          console.log('Location permission not granted');
        }

        // Navigate based on user type
        const userType = response.data.user.user_type;
        console.log('Navigating for user type:', userType);
        
        if (userType === 'customer') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Customer' }],
          });
        } else if (userType === 'mechanic') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Mechanic' }],
          });
        } else if (userType === 'vendor') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Vendor' }],
          });
        } else {
          console.error('Unknown user type:', userType);
          setError('Unknown user type. Please contact support.');
        }
      } else {
        console.error('Invalid response structure:', response);
        setError('Invalid response from server');
      }
    } catch (error: any) {
      setError(
        error.response?.data?.error?.message || 'Invalid code. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setResendLoading(true);
      await authService.resendOTP(email, phone);
      setCountdown(60);
      Alert.alert('Success', 'Verification code has been resent');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.error?.message || 'Failed to resend code'
      );
    } finally {
      setResendLoading(false);
    }
  };

  const contactInfo = email || phone || 'your contact';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Verify Your Account</Text>
        <Text style={styles.subtitle}>
          Enter the code sent to {contactInfo}
        </Text>

        <OTPInput
          length={6}
          onComplete={handleVerifyOTP}
          error={error}
        />

        {loading && (
          <Text style={styles.loadingText}>Verifying...</Text>
        )}

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code? </Text>
          {countdown > 0 ? (
            <Text style={styles.countdownText}>
              Resend in {countdown}s
            </Text>
          ) : (
            <TouchableOpacity
              onPress={handleResendCode}
              disabled={resendLoading}
            >
              <Text style={styles.resendLink}>
                {resendLoading ? 'Sending...' : 'Resend Code'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 40,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#000000',
    textAlign: 'center',
    marginTop: 16,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  resendText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  resendLink: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  countdownText: {
    fontSize: 14,
    color: '#8E8E93',
  },
});

