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
  TouchableOpacity,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Picker } from '@react-native-picker/picker';
import { Button, Input } from '../../components/common';
import { FileUpload } from '../../components/forms';
import { authService } from '../../services/authService';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import { ImagePickerResult } from '../../hooks/useImagePicker';

type MechanicSignupScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'MechanicSignup'
>;

interface MechanicSignupData {
  // Step 1: Basic Info
  full_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
  gender: string;

  // Step 2: Address & Documents
  home_address: string;
  work_address: string;
  utility_bill?: ImagePickerResult | null;
  id_type: string;
  id_document?: ImagePickerResult | null;
  profile_photo?: ImagePickerResult | null;

  // Step 3: Guarantors
  guarantor1_name: string;
  guarantor1_phone: string;
  guarantor1_address: string;
  guarantor1_relationship: string;
  guarantor2_name: string;
  guarantor2_phone: string;
  guarantor2_address: string;
  guarantor2_relationship: string;

  // Step 4: Specializations
  specializations: string[];

  // Step 5: Review
  terms_accepted: boolean;
}

const SPECIALIZATIONS = [
  'Engine Repair',
  'Electrical Systems',
  'AC Repair',
  'Body Work',
  'Brake Systems',
  'Transmission',
  'General Maintenance',
  'Diagnostics',
  'Tire Services',
  'Oil Change',
  'Battery Services',
  'Suspension',
];

const TOTAL_STEPS = 5;

export const MechanicSignupScreen: React.FC = () => {
  const navigation = useNavigation<MechanicSignupScreenNavigationProp>();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    trigger,
  } = useForm<MechanicSignupData>({
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      password: '',
      confirm_password: '',
      gender: '',
      home_address: '',
      work_address: '',
      utility_bill: null,
      id_type: '',
      id_document: null,
      profile_photo: null,
      guarantor1_name: '',
      guarantor1_phone: '',
      guarantor1_address: '',
      guarantor1_relationship: '',
      guarantor2_name: '',
      guarantor2_phone: '',
      guarantor2_address: '',
      guarantor2_relationship: '',
      specializations: [],
      terms_accepted: false,
    },
  });

  const password = watch('password');
  const specializations = watch('specializations') || [];

  const validateStep = async (step: number): Promise<boolean> => {
    let fields: (keyof MechanicSignupData)[] = [];

    switch (step) {
      case 1:
        fields = ['full_name', 'email', 'phone', 'password', 'confirm_password', 'gender'];
        break;
      case 2:
        fields = ['home_address', 'work_address', 'utility_bill', 'id_type', 'id_document', 'profile_photo'];
        break;
      case 3:
        fields = [
          'guarantor1_name',
          'guarantor1_phone',
          'guarantor1_address',
          'guarantor1_relationship',
          'guarantor2_name',
          'guarantor2_phone',
          'guarantor2_address',
          'guarantor2_relationship',
        ];
        break;
      case 4:
        fields = ['specializations'];
        break;
      case 5:
        fields = ['terms_accepted'];
        break;
    }

    const result = await trigger(fields as any);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: MechanicSignupData) => {
    try {
      setLoading(true);
      const response = await authService.registerMechanic(data);
      
      if (response.success) {
        setSubmitted(true);
      }
    } catch (error: any) {
      Alert.alert(
        'Registration Failed',
        error.response?.data?.error?.message || 'An error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleSpecialization = (spec: string) => {
    const current = watch('specializations') || [];
    const updated = current.includes(spec)
      ? current.filter((s) => s !== spec)
      : [...current, spec];
    control._formValues.specializations = updated;
  };

  // Application Submitted Screen
  if (submitted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.submittedContainer}>
          <Text style={styles.submittedIcon}>✓</Text>
          <Text style={styles.submittedTitle}>Application Submitted</Text>
          <Text style={styles.submittedMessage}>
            Your application is under review. You'll receive your login credentials via SMS/email once approved.
          </Text>
          <Button
            title="Back to Login"
            onPress={() => navigation.navigate('Login')}
            style={styles.submittedButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Step {currentStep} of {TOTAL_STEPS}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(currentStep / TOTAL_STEPS) * 100}%` },
              ]}
            />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Mechanic Registration</Text>

          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Basic Information</Text>

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
                      <Text style={styles.errorText}>{errors.gender.message}</Text>
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
          )}

          {/* Step 2: Address & Documents */}
          {currentStep === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Address & Documents</Text>

              <Controller
                control={control}
                name="home_address"
                rules={{ required: 'Home address is required' }}
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Home Address"
                    value={value}
                    onChangeText={onChange}
                    error={errors.home_address?.message}
                    multiline
                    numberOfLines={3}
                  />
                )}
              />

              <Controller
                control={control}
                name="work_address"
                rules={{ required: 'Work address is required' }}
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Work Address"
                    value={value}
                    onChangeText={onChange}
                    error={errors.work_address?.message}
                    multiline
                    numberOfLines={3}
                  />
                )}
              />

              <Controller
                control={control}
                name="utility_bill"
                rules={{ required: 'Utility bill is required' }}
                render={({ field: { onChange, value } }) => (
                  <FileUpload
                    label="Utility Bill"
                    value={value}
                    onChange={onChange}
                    error={errors.utility_bill?.message}
                    required
                  />
                )}
              />

              <Controller
                control={control}
                name="id_type"
                rules={{ required: 'ID type is required' }}
                render={({ field: { onChange, value } }) => (
                  <View style={styles.pickerContainer}>
                    <Text style={styles.label}>ID Type</Text>
                    <View style={styles.pickerWrapper}>
                      <Picker
                        selectedValue={value}
                        onValueChange={onChange}
                        style={styles.picker}
                      >
                        <Picker.Item label="Select ID Type" value="" />
                        <Picker.Item label="Passport" value="passport" />
                        <Picker.Item label="National ID" value="national_id" />
                        <Picker.Item label="Driver's License" value="drivers_license" />
                      </Picker>
                    </View>
                    {errors.id_type && (
                      <Text style={styles.errorText}>{errors.id_type.message}</Text>
                    )}
                  </View>
                )}
              />

              <Controller
                control={control}
                name="id_document"
                rules={{ required: 'ID document is required' }}
                render={({ field: { onChange, value } }) => (
                  <FileUpload
                    label="ID Document"
                    value={value}
                    onChange={onChange}
                    error={errors.id_document?.message}
                    required
                  />
                )}
              />

              <Controller
                control={control}
                name="profile_photo"
                rules={{ required: 'Profile photo is required' }}
                render={({ field: { onChange, value } }) => (
                  <FileUpload
                    label="Profile Photo"
                    value={value}
                    onChange={onChange}
                    error={errors.profile_photo?.message}
                    required
                    allowCamera
                  />
                )}
              />
            </View>
          )}

          {/* Step 3: Guarantors */}
          {currentStep === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Guarantors</Text>
              <Text style={styles.stepSubtitle}>Please provide information for two guarantors</Text>

              <Text style={styles.guarantorLabel}>Guarantor 1</Text>
              <Controller
                control={control}
                name="guarantor1_name"
                rules={{ required: 'Guarantor 1 name is required' }}
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Full Name"
                    value={value}
                    onChangeText={onChange}
                    error={errors.guarantor1_name?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="guarantor1_phone"
                rules={{ required: 'Guarantor 1 phone is required' }}
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Phone Number"
                    value={value}
                    onChangeText={onChange}
                    error={errors.guarantor1_phone?.message}
                    keyboardType="phone-pad"
                  />
                )}
              />

              <Controller
                control={control}
                name="guarantor1_address"
                rules={{ required: 'Guarantor 1 address is required' }}
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Address"
                    value={value}
                    onChangeText={onChange}
                    error={errors.guarantor1_address?.message}
                    multiline
                    numberOfLines={2}
                  />
                )}
              />

              <Controller
                control={control}
                name="guarantor1_relationship"
                rules={{ required: 'Relationship is required' }}
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Relationship"
                    value={value}
                    onChangeText={onChange}
                    error={errors.guarantor1_relationship?.message}
                    placeholder="e.g., Friend, Family, Colleague"
                  />
                )}
              />

              <Text style={styles.guarantorLabel}>Guarantor 2</Text>
              <Controller
                control={control}
                name="guarantor2_name"
                rules={{ required: 'Guarantor 2 name is required' }}
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Full Name"
                    value={value}
                    onChangeText={onChange}
                    error={errors.guarantor2_name?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="guarantor2_phone"
                rules={{ required: 'Guarantor 2 phone is required' }}
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Phone Number"
                    value={value}
                    onChangeText={onChange}
                    error={errors.guarantor2_phone?.message}
                    keyboardType="phone-pad"
                  />
                )}
              />

              <Controller
                control={control}
                name="guarantor2_address"
                rules={{ required: 'Guarantor 2 address is required' }}
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Address"
                    value={value}
                    onChangeText={onChange}
                    error={errors.guarantor2_address?.message}
                    multiline
                    numberOfLines={2}
                  />
                )}
              />

              <Controller
                control={control}
                name="guarantor2_relationship"
                rules={{ required: 'Relationship is required' }}
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Relationship"
                    value={value}
                    onChangeText={onChange}
                    error={errors.guarantor2_relationship?.message}
                    placeholder="e.g., Friend, Family, Colleague"
                  />
                )}
              />
            </View>
          )}

          {/* Step 4: Specializations */}
          {currentStep === 4 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Specializations</Text>
              <Text style={styles.stepSubtitle}>
                Select all areas you specialize in
              </Text>

              <Controller
                control={control}
                name="specializations"
                rules={{
                  required: 'Please select at least one specialization',
                  validate: (value) =>
                    (value && value.length > 0) || 'Please select at least one specialization',
                }}
                render={() => (
                  <View style={styles.specializationsContainer}>
                    {SPECIALIZATIONS.map((spec) => (
                      <TouchableOpacity
                        key={spec}
                        style={[
                          styles.specializationItem,
                          specializations.includes(spec) && styles.specializationItemSelected,
                        ]}
                        onPress={() => toggleSpecialization(spec)}
                      >
                        <Text
                          style={[
                            styles.specializationText,
                            specializations.includes(spec) && styles.specializationTextSelected,
                          ]}
                        >
                          {specializations.includes(spec) ? '✓ ' : ''}{spec}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              />
              {errors.specializations && (
                <Text style={styles.errorText}>{errors.specializations.message}</Text>
              )}
            </View>
          )}

          {/* Step 5: Review & Submit */}
          {currentStep === 5 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Review & Submit</Text>
              <Text style={styles.stepSubtitle}>Please review your information before submitting</Text>

              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Basic Information</Text>
                <Text style={styles.reviewText}>
                  <Text style={styles.reviewLabel}>Name:</Text> {watch('full_name')}
                </Text>
                <Text style={styles.reviewText}>
                  <Text style={styles.reviewLabel}>Email:</Text> {watch('email')}
                </Text>
                <Text style={styles.reviewText}>
                  <Text style={styles.reviewLabel}>Phone:</Text> {watch('phone')}
                </Text>
                <Text style={styles.reviewText}>
                  <Text style={styles.reviewLabel}>Gender:</Text> {watch('gender')}
                </Text>
              </View>

              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Addresses</Text>
                <Text style={styles.reviewText}>
                  <Text style={styles.reviewLabel}>Home:</Text> {watch('home_address')}
                </Text>
                <Text style={styles.reviewText}>
                  <Text style={styles.reviewLabel}>Work:</Text> {watch('work_address')}
                </Text>
              </View>

              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Specializations</Text>
                <Text style={styles.reviewText}>
                  {specializations.length > 0
                    ? specializations.join(', ')
                    : 'None selected'}
                </Text>
              </View>

              <Controller
                control={control}
                name="terms_accepted"
                rules={{
                  required: 'You must accept the terms and conditions',
                  validate: (value) => value === true || 'You must accept the terms and conditions',
                }}
                render={({ field: { onChange, value } }) => (
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => onChange(!value)}
                  >
                    <View style={[styles.checkbox, value && styles.checkboxChecked]}>
                      {value && <Text style={styles.checkboxCheck}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxLabel}>
                      I accept the terms and conditions
                    </Text>
                  </TouchableOpacity>
                )}
              />
              {errors.terms_accepted && (
                <Text style={styles.errorText}>{errors.terms_accepted.message}</Text>
              )}
            </View>
          )}

          {/* Navigation Buttons */}
          <View style={styles.navigationButtons}>
            {currentStep > 1 && (
              <Button
                title="Back"
                onPress={handleBack}
                variant="outline"
                style={styles.backButton}
              />
            )}
            {currentStep < TOTAL_STEPS ? (
              <Button
                title="Next"
                onPress={handleNext}
                style={styles.nextButton}
              />
            ) : (
              <Button
                title="Submit Application"
                onPress={handleSubmit(onSubmit)}
                loading={loading}
                style={styles.submitButton}
              />
            )}
          </View>
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
  progressContainer: {
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  progressText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#000000',
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
  stepContainer: {
    marginTop: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 24,
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
  guarantorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 12,
  },
  specializationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  specializationItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  specializationItemSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  specializationText: {
    fontSize: 14,
    color: '#000000',
  },
  specializationTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  reviewSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  reviewSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  reviewText: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 8,
    lineHeight: 20,
  },
  reviewLabel: {
    fontWeight: '600',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  checkboxCheck: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#000000',
    flex: 1,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
  submittedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  submittedIcon: {
    fontSize: 80,
    color: '#34C759',
    marginBottom: 24,
  },
  submittedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
    textAlign: 'center',
  },
  submittedMessage: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  submittedButton: {
    minWidth: 200,
  },
});

