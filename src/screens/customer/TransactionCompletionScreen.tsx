import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { Button, Input } from '../../components/common';
import { serviceRequestService } from '../../services/serviceRequestService';
import { CustomerStackParamList } from '../../navigation/types';

type TransactionCompletionScreenRouteProp = RouteProp<
  CustomerStackParamList,
  'TransactionCompletion'
>;
type TransactionCompletionScreenNavigationProp = StackNavigationProp<
  CustomerStackParamList,
  'TransactionCompletion'
>;

interface TransactionForm {
  material_cost: string;
  labor_cost: string;
  rating: number;
  review: string;
}

export const TransactionCompletionScreen: React.FC = () => {
  const navigation = useNavigation<TransactionCompletionScreenNavigationProp>();
  const route = useRoute<TransactionCompletionScreenRouteProp>();
  const { requestId } = route.params;

  const [loading, setLoading] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TransactionForm>({
    defaultValues: {
      material_cost: '',
      labor_cost: '',
      rating: 0,
      review: '',
    },
  });

  const materialCost = watch('material_cost');
  const laborCost = watch('labor_cost');

  const materialCostNum = parseFloat(materialCost) || 0;
  const laborCostNum = parseFloat(laborCost) || 0;
  const totalCost = materialCostNum + laborCostNum;

  const onSubmit = async (data: TransactionForm) => {
    if (selectedRating === 0) {
      Alert.alert('Error', 'Please provide a rating');
      return;
    }

    try {
      setLoading(true);
      const response = await serviceRequestService.completeServiceRequest(
        requestId,
        {
          material_cost: materialCostNum,
          labor_cost: laborCostNum,
          rating: selectedRating,
          review: data.review || undefined,
        }
      );

      if (response.success) {
        Alert.alert('Success', 'Transaction completed successfully!', [
          {
            text: 'Done',
            onPress: () => {
              navigation.navigate('CustomerTabs', { screen: 'HomeTab' });
            },
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.error?.message || 'Failed to complete transaction'
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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Complete Your Transaction</Text>
            <Text style={styles.headerSubtitle}>
              Review and finalize your service payment
            </Text>
          </View>

          {/* Cost Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Costs</Text>

            <Controller
              control={control}
              name="material_cost"
              rules={{
                required: 'Material cost is required',
                min: { value: 0, message: 'Cost must be positive' },
              }}
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Material Cost (₦)</Text>
                  <Input
                    value={value}
                    onChangeText={onChange}
                    keyboardType="numeric"
                    placeholder="0.00"
                    error={errors.material_cost?.message}
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name="labor_cost"
              rules={{
                required: 'Labor cost is required',
                min: { value: 0, message: 'Cost must be positive' },
              }}
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Labor Cost (₦)</Text>
                  <Input
                    value={value}
                    onChangeText={onChange}
                    keyboardType="numeric"
                    placeholder="0.00"
                    error={errors.labor_cost?.message}
                  />
                </View>
              )}
            />

            {/* Total Display */}
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total Cost</Text>
              <Text style={styles.totalAmount}>₦{totalCost.toFixed(2)}</Text>
            </View>
          </View>

          {/* Rating Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rate Your Mechanic</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setSelectedRating(star)}
                  style={styles.starButton}
                >
                  <Ionicons
                    name={star <= selectedRating ? 'star' : 'star-outline'}
                    size={40}
                    color={star <= selectedRating ? '#FF9500' : '#C6C6C8'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {selectedRating === 0 && (
              <Text style={styles.errorText}>Please select a rating</Text>
            )}
          </View>

          {/* Review Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Review (Optional)</Text>
            <Controller
              control={control}
              name="review"
              render={({ field: { onChange, value } }) => (
                <Input
                  value={value}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={4}
                  placeholder="Share your experience..."
                  style={styles.reviewInput}
                />
              )}
            />
          </View>

          <Button
            title="Submit"
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
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
    textAlign: 'center',
  },
  reviewInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 8,
  },
});

