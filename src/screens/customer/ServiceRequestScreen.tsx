import React, { useState, useEffect } from 'react';
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
import { useForm, Controller } from 'react-hook-form';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input } from '../../components/common';
import { serviceRequestService, CreateServiceRequestData } from '../../services/serviceRequestService';
import { customerService } from '../../services/customerService';
import { mechanicService, Category } from '../../services/mechanicService';
import { useLocationStore } from '../../store/locationStore';
import { Mechanic, Vehicle } from '../../types';
import { CustomerStackParamList } from '../../navigation/types';
import * as Location from 'expo-location';

type ServiceRequestScreenRouteProp = RouteProp<CustomerStackParamList, 'ServiceRequest'>;
type ServiceRequestScreenNavigationProp = StackNavigationProp<CustomerStackParamList, 'ServiceRequest'>;

interface ServiceRequestForm {
  vehicle_id: string;
  category_id: string;
  problem_description: string;
}

export const ServiceRequestScreen: React.FC = () => {
  const navigation = useNavigation<ServiceRequestScreenNavigationProp>();
  const route = useRoute<ServiceRequestScreenRouteProp>();
  const { mechanic } = route.params;
  const { currentLocation } = useLocationStore();

  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locationAddress, setLocationAddress] = useState<string>('');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ServiceRequestForm>({
    defaultValues: {
      vehicle_id: '',
      category_id: '',
      problem_description: '',
    },
  });

  useEffect(() => {
    loadVehicles();
    loadCategories();
    getLocationAddress();
  }, []);

  const loadVehicles = async () => {
    try {
      const response = await customerService.getVehicles();
      if (response.success) {
        setVehicles(response.data);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
      // Use mock vehicles for now if API fails
      setVehicles([
        { id: '1', customer_id: '1', car_name: 'Toyota', car_model: 'Camry', car_year: 2020, is_primary: true },
      ]);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await mechanicService.getCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const getLocationAddress = async () => {
    if (!currentLocation) return;

    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });

      if (addresses.length > 0) {
        const address = addresses[0];
        const addressString = [
          address.street,
          address.city,
          address.region,
          address.country,
        ]
          .filter(Boolean)
          .join(', ');
        setLocationAddress(addressString);
      }
    } catch (error) {
      console.error('Error getting address:', error);
    }
  };

  const onSubmit = async (data: ServiceRequestForm) => {
    if (!currentLocation) {
      Alert.alert('Error', 'Location is required. Please enable location services.');
      return;
    }

    try {
      setLoading(true);
      const requestData: CreateServiceRequestData = {
        mechanic_id: mechanic.id.toString(),
        vehicle_id: data.vehicle_id,
        category_id: data.category_id,
        problem_description: data.problem_description,
        location: {
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
          address: locationAddress,
        },
      };

      const response = await serviceRequestService.createServiceRequest(requestData);

      if (response.success) {
        navigation.replace('RequestTracking', {
          requestId: response.data.id,
        });
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.error?.message || 'Failed to create service request'
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
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#000000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Request Service</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Mechanic Info Card */}
          <View style={styles.mechanicCard}>
            <View style={styles.mechanicInfo}>
              {mechanic.profile_photo || mechanic.profile_picture_url ? (
                <View style={styles.mechanicImageContainer}>
                  <Text style={styles.mechanicInitial}>
                    {mechanic.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              ) : (
                <View style={styles.mechanicImagePlaceholder}>
                  <Ionicons name="person" size={32} color="#8E8E93" />
                </View>
              )}
              <View style={styles.mechanicDetails}>
                <Text style={styles.mechanicName}>{mechanic.name}</Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#FF9500" />
                  <Text style={styles.rating}>{mechanic.rating}</Text>
                  {mechanic.distance && (
                    <Text style={styles.distance}> • {mechanic.distance} km away</Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Controller
              control={control}
              name="vehicle_id"
              rules={{ required: 'Please select a vehicle' }}
              render={({ field: { onChange, value } }) => (
                <View style={styles.pickerContainer}>
                  <Text style={styles.label}>Select Vehicle</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={value}
                      onValueChange={onChange}
                      style={styles.picker}
                    >
                      <Picker.Item label="Select Vehicle" value="" />
                      {vehicles.map((vehicle) => (
                        <Picker.Item
                          key={vehicle.id}
                          label={`${vehicle.car_name} ${vehicle.car_model} ${vehicle.car_year || ''}`}
                          value={vehicle.id}
                        />
                      ))}
                    </Picker>
                  </View>
                  {errors.vehicle_id && (
                    <Text style={styles.errorText}>
                      {errors.vehicle_id.message}
                    </Text>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="category_id"
              rules={{ required: 'Please select a problem category' }}
              render={({ field: { onChange, value } }) => (
                <View style={styles.pickerContainer}>
                  <Text style={styles.label}>Problem Category</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={value}
                      onValueChange={onChange}
                      style={styles.picker}
                    >
                      <Picker.Item label="Select Category" value="" />
                      {categories.map((category) => (
                        <Picker.Item
                          key={category.id}
                          label={category.name}
                          value={category.id}
                        />
                      ))}
                    </Picker>
                  </View>
                  {errors.category_id && (
                    <Text style={styles.errorText}>
                      {errors.category_id.message}
                    </Text>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="problem_description"
              rules={{
                required: 'Please describe the problem',
                minLength: {
                  value: 10,
                  message: 'Description must be at least 10 characters',
                },
              }}
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Problem Description"
                  value={value}
                  onChangeText={onChange}
                  error={errors.problem_description?.message}
                  multiline
                  numberOfLines={4}
                  placeholder="Describe the problem with your vehicle..."
                  style={styles.textArea}
                />
              )}
            />

            {/* Location Display */}
            <View style={styles.locationContainer}>
              <Text style={styles.label}>Service Location</Text>
              <View style={styles.locationCard}>
                <Ionicons name="location" size={20} color="#000000" />
                <View style={styles.locationText}>
                  <Text style={styles.locationAddress}>
                    {locationAddress || 'Getting address...'}
                  </Text>
                  {currentLocation && (
                    <Text style={styles.locationCoords}>
                      {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            <Button
              title="Send Request"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              style={styles.submitButton}
            />
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
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  placeholder: {
    width: 32,
  },
  mechanicCard: {
    backgroundColor: '#F2F2F7',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  mechanicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mechanicImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mechanicInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  mechanicImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mechanicDetails: {
    flex: 1,
  },
  mechanicName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    color: '#000000',
    marginLeft: 4,
    fontWeight: '500',
  },
  distance: {
    fontSize: 14,
    color: '#8E8E93',
  },
  form: {
    padding: 16,
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  locationContainer: {
    marginBottom: 24,
  },
  locationCard: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
    alignItems: 'flex-start',
  },
  locationText: {
    flex: 1,
    marginLeft: 12,
  },
  locationAddress: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 12,
    color: '#8E8E93',
  },
  submitButton: {
    marginTop: 8,
  },
});

