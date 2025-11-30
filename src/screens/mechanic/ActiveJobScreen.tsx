import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import MapView, {
  Marker,
  // Removed PROVIDER_GOOGLE - using default provider
  Region,
  Polyline,
} from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MechanicStackParamList } from '../../navigation/types';
import { ServiceRequest } from '../../types';
import { serviceRequestService } from '../../services/serviceRequestService';

type ActiveJobScreenRouteProp = RouteProp<MechanicStackParamList, 'ActiveJob'>;
type ActiveJobScreenNavigationProp = StackNavigationProp<
  MechanicStackParamList,
  'ActiveJob'
>;

export const ActiveJobScreen: React.FC = () => {
  const route = useRoute<ActiveJobScreenRouteProp>();
  const navigation = useNavigation<ActiveJobScreenNavigationProp>();
  const mapRef = useRef<MapView>(null);
  const { requestId } = route.params;

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [mechanicLocation, setMechanicLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [hasArrived, setHasArrived] = useState(false);

  useEffect(() => {
    loadRequest();
    getCurrentLocation();
  }, [requestId]);

  const loadRequest = async () => {
    try {
      setLoading(true);
      const response = await serviceRequestService.getServiceRequest(requestId);
      if (response.success) {
        setRequest(response.data);
        setHasArrived(response.data.status === 'in_progress');
      }
    } catch (error) {
      console.error('Error loading request:', error);
      Alert.alert('Error', 'Failed to load service request');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setMechanicLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleNavigate = () => {
    if (!request?.customer_location_lat || !request?.customer_location_lng) {
      Alert.alert('Error', 'Customer location not available');
      return;
    }

    const lat = request.customer_location_lat;
    const lng = request.customer_location_lng;
    const label = request.customer_location_address || 'Customer Location';

    const url = Platform.select({
      ios: `maps://app?daddr=${lat},${lng}&dirflg=d`,
      android: `google.navigation:q=${lat},${lng}`,
    });

    if (url) {
      Linking.openURL(url).catch((err) => {
        // Fallback to web maps
        const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        Linking.openURL(webUrl);
      });
    }
  };

  const handleCallCustomer = () => {
    const phoneNumber = (request as any)?.customer?.phone;
    if (!phoneNumber) {
      Alert.alert('Error', 'Customer phone number not available');
      return;
    }

    const url = `tel:${phoneNumber}`;
    Linking.openURL(url);
  };

  const handleArrived = async () => {
    if (!request || processing) return;

    try {
      setProcessing(true);
      const response = await serviceRequestService.markArrived(request.id);
      if (response.success) {
        setHasArrived(true);
        setRequest(response.data);
        Alert.alert('Success', 'You have marked yourself as arrived');
      }
    } catch (error: any) {
      console.error('Error marking as arrived:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error?.message || 'Failed to mark as arrived'
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkDone = () => {
    Alert.alert(
      'Confirm Completion',
      'Are you sure you have completed this service?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'default',
          onPress: handleCompleteRequest,
        },
      ]
    );
  };

  const handleCompleteRequest = async () => {
    if (!request || processing) return;

    try {
      setProcessing(true);
      const response = await serviceRequestService.completeServiceRequestMechanic(
        request.id
      );
      if (response.success) {
        Alert.alert(
          'Success',
          'Service marked as complete. Waiting for customer confirmation.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Error completing request:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error?.message || 'Failed to complete request'
      );
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Service request not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const customerLocation =
    request.customer_location_lat && request.customer_location_lng
      ? {
          latitude: request.customer_location_lat,
          longitude: request.customer_location_lng,
        }
      : null;

  const customerName = (request as any)?.customer?.full_name || 'Customer';
  const customerPhoto = (request as any)?.customer?.profile_picture_url;
  const customerPhone = (request as any)?.customer?.phone;

  // Calculate map region to show both locations
  const mapRegion: Region | undefined =
    customerLocation && mechanicLocation
      ? {
          latitude:
            (customerLocation.latitude + mechanicLocation.latitude) / 2,
          longitude:
            (customerLocation.longitude + mechanicLocation.longitude) / 2,
          latitudeDelta:
            Math.abs(customerLocation.latitude - mechanicLocation.latitude) *
              1.5 +
            0.01,
          longitudeDelta:
            Math.abs(customerLocation.longitude - mechanicLocation.longitude) *
              1.5 +
            0.01,
        }
      : customerLocation
      ? {
          latitude: customerLocation.latitude,
          longitude: customerLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }
      : undefined;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        {mapRegion && (
          <MapView
            ref={mapRef}
            style={styles.map}
            // Using default provider (works in Expo Go)
            initialRegion={mapRegion}
            showsUserLocation={true}
            showsMyLocationButton={false}
          >
            {customerLocation && (
              <Marker
                coordinate={customerLocation}
                title="Customer Location"
                description={request.customer_location_address}
              >
                <View style={styles.customerMarker}>
                  <Ionicons name="location" size={32} color="#FF3B30" />
                </View>
              </Marker>
            )}
            {mechanicLocation && (
              <Marker
                coordinate={mechanicLocation}
                title="Your Location"
              >
                <View style={styles.mechanicMarker}>
                  <Ionicons name="location" size={32} color="#007AFF" />
                </View>
              </Marker>
            )}
            {customerLocation && mechanicLocation && (
              <Polyline
                coordinates={[mechanicLocation, customerLocation]}
                strokeColor="#007AFF"
                strokeWidth={3}
                lineDashPattern={[5, 5]}
              />
            )}
          </MapView>
        )}

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Active Job</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Customer Info Card */}
      <View style={styles.customerCard}>
        <View style={styles.customerInfo}>
          {customerPhoto ? (
            <Image
              source={{ uri: customerPhoto }}
              style={styles.customerPhoto}
            />
          ) : (
            <View style={styles.customerPhotoPlaceholder}>
              <Ionicons name="person" size={24} color="#8E8E93" />
            </View>
          )}
          <View style={styles.customerDetails}>
            <Text style={styles.customerName}>{customerName}</Text>
            {request.vehicle && (
              <Text style={styles.vehicleText}>
                {request.vehicle.car_name} {request.vehicle.car_model}
              </Text>
            )}
            {request.customer_location_address && (
              <Text style={styles.addressText} numberOfLines={1}>
                {request.customer_location_address}
              </Text>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.navigateButton]}
            onPress={handleNavigate}
          >
            <Ionicons name="navigate" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Navigate</Text>
          </TouchableOpacity>

          {customerPhone && (
            <TouchableOpacity
              style={[styles.actionButton, styles.callButton]}
              onPress={handleCallCustomer}
            >
              <Ionicons name="call" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>
          )}

          {!hasArrived ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.arrivedButton]}
              onPress={handleArrived}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>I've Arrived</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.doneButton]}
              onPress={handleMarkDone}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Mark as Done</Text>
                </>
              )}
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
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8E8E93',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 44,
  },
  customerMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mechanicMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  customerPhoto: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 12,
  },
  customerPhotoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  vehicleText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  navigateButton: {
    backgroundColor: '#007AFF',
  },
  callButton: {
    backgroundColor: '#34C759',
  },
  arrivedButton: {
    backgroundColor: '#FF9500',
  },
  doneButton: {
    backgroundColor: '#34C759',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

