import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Picker } from '@react-native-picker/picker';
import { Button, Input } from '../../components/common';
import { authService, CustomerSignupData } from '../../services/authService';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';

type CustomerSignupScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'CustomerSignup'
>;

export const CustomerSignupScreen: React.FC = () => {
  const navigation = useNavigation<CustomerSignupScreenNavigationProp>();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CustomerSignupData>({
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      password: '',
      confirm_password: '',
      gender: '',
      car_name: '',
      car_model: '',
      car_year: undefined,
    },
  });

  const password = watch('password');

  const onSubmit = async (data: CustomerSignupData) => {
    try {
      setLoading(true);
      const response = await authService.registerCustomer(data);
      
      if (response.success) {
        navigation.navigate('OTPVerification', {
          email: data.email,
          phone: data.phone,
        });
      }
    } catch (error: any) {
      Alert.alert(
        'Signup Failed',
        error.response?.data?.error?.message || 'An error occurred. Please try again.'
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up as a customer</Text>

          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <Controller
              control={control}
              name="full_name"
              rules={{
                required: 'Full name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters',
                },
              }}
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Full Name"
                  value={value}
                  onChangeText={onChange}
                  error={errors.full_name?.message}
                  autoCapitalize="words"
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              rules={{
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              }}
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Email"
                  value={value}
                  onChangeText={onChange}
                  error={errors.email?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            />

            <Controller
              control={control}
              name="phone"
              rules={{
                required: 'Phone number is required',
                pattern: {
                  value: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
                  message: 'Invalid phone number',
                },
              }}
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Phone Number"
                  value={value}
                  onChangeText={onChange}
                  error={errors.phone?.message}
                  keyboardType="phone-pad"
                />
              )}
            />

            <Controller
              control={control}
              name="gender"
              rules={{ required: 'Gender is required' }}
              render={({ field: { onChange, value } }) => (
                <View style={styles.pickerContainer}>
                  <Text style={styles.label}>Gender</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={value}
                      onValueChange={onChange}
                      style={styles.picker}
                    >
                      <Picker.Item label="Select Gender" value="" />
                      <Picker.Item label="Male" value="male" />
                      <Picker.Item label="Female" value="female" />
                      <Picker.Item label="Other" value="other" />
                    </Picker>
                  </View>
                  {errors.gender && (
                    <Text style={styles.errorText}>
                      {errors.gender.message}
                    </Text>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="password"
              rules={{
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
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

            <Controller
              control={control}
              name="confirm_password"
              rules={{
                required: 'Please confirm your password',
                validate: (value) =>
                  value === password || 'Passwords do not match',
              }}
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Confirm Password"
                  value={value}
                  onChangeText={onChange}
                  error={errors.confirm_password?.message}
                  secureTextEntry
                />
              )}
            />
          </View>

          {/* Vehicle Information (Optional) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vehicle Information (Optional)</Text>

            <Controller
              control={control}
              name="car_name"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Car Name/Brand"
                  value={value}
                  onChangeText={onChange}
                  placeholder="e.g., Toyota"
                />
              )}
            />

            <Controller
              control={control}
              name="car_model"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Car Model"
                  value={value}
                  onChangeText={onChange}
                  placeholder="e.g., Camry"
                />
              )}
            />

            <Controller
              control={control}
              name="car_year"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Car Year"
                  value={value?.toString() || ''}
                  onChangeText={(text) => {
                    const year = text ? parseInt(text, 10) : undefined;
                    onChange(isNaN(year!) ? undefined : year);
                  }}
                  keyboardType="number-pad"
                  placeholder="e.g., 2020"
                />
              )}
            />
          </View>

          <Button
            title="Sign Up"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            style={styles.submitButton}
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
    padding: 24,
    paddingBottom: 40,
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
  submitButton: {
    marginTop: 16,
  },
});

