import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Button, Input } from '../../components/common';
import { authService, LoginCredentials } from '../../services/authService';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuthStore } from '../../store/authStore';
import { AuthStackParamList, RootStackParamList } from '../../navigation/types';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;
type RootNavigationProp = StackNavigationProp<RootStackParamList>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp & RootNavigationProp>();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials & { identifier: string }>({
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const onSubmit = async (data: { identifier: string; password: string }) => {
    try {
      setLoading(true);
      
      // Determine if identifier is email or phone
      const isEmail = data.identifier.includes('@');
      const credentials: LoginCredentials = {
        password: data.password,
        ...(isEmail ? { email: data.identifier } : { phone: data.identifier }),
      };

      const response = await authService.login(credentials);

      if (response.success && response.data) {
        // Store auth data
        login(response.data.user, response.data.token);

        // Navigate based on user type
        const userType = response.data.user.user_type;
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
        }
      }
    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error.response?.data?.error?.message || 'Invalid credentials. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Login to your account</Text>

          <Controller
            control={control}
            name="identifier"
            rules={{
              required: 'Email or phone is required',
            }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Email or Phone"
                value={value}
                onChangeText={onChange}
                error={errors.identifier?.message}
                keyboardType="default"
                autoCapitalize="none"
                autoComplete="email"
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            rules={{
              required: 'Password is required',
            }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Password"
                value={value}
                onChangeText={onChange}
                error={errors.password?.message}
                secureTextEntry
              />
            )}
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotPasswordContainer}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button
            title="Login"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            style={styles.loginButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 32,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  loginButton: {
    marginTop: 8,
  },
});

