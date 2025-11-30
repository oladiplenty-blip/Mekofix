import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import MapView, { Marker, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/common';
import { serviceRequestService } from '../../services/serviceRequestService';
import { useServiceRequestSubscription } from '../../hooks/useServiceRequestSubscription';
import { ServiceRequest } from '../../types';
import { CustomerStackParamList } from '../../navigation/types';

type RequestTrackingScreenRouteProp = RouteProp<CustomerStackParamList, 'RequestTracking'>;
type RequestTrackingScreenNavigationProp = StackNavigationProp<CustomerStackParamList, 'RequestTracking'>;

const statusSteps = [
  { key: 'pending', label: 'Pending', icon: 'time-outline' },
  { key: 'accepted', label: 'Accepted', icon: 'checkmark-circle-outline' },
  { key: 'in_progress', label: 'In Progress', icon: 'build-outline' },
  { key: 'completed', label: 'Completed', icon: 'checkmark-done-outline' },
];

export const RequestTrackingScreen: React.FC = () => {
  const navigation = useNavigation<RequestTrackingScreenNavigationProp>();
  const route = useRoute<RequestTrackingScreenRouteProp>();
  const { requestId } = route.params;

  const { serviceRequest, loading } = useServiceRequestSubscription(requestId);
  const [cancelling, setCancelling] = useState(false);
  const [mechanicLocation, setMechanicLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Mock mechanic location for demo (in real app, this would come from real-time updates)
    if (serviceRequest?.status === 'accepted' || serviceRequest?.status === 'in_progress') {
      // Simulate mechanic location slightly away from customer
      if (serviceRequest.customer_location_lat && serviceRequest.customer_location_lng) {
        setMechanicLocation({
          lat: serviceRequest.customer_location_lat + 0.01,
          lng: serviceRequest.customer_location_lng + 0.01,
        });
      }
    }

    // Navigate to transaction completion when mechanic confirms and customer hasn't
    if (
      serviceRequest?.mechanic_confirmed &&
      !serviceRequest?.customer_confirmed &&
      serviceRequest?.status === 'in_progress'
    ) {
      // Show prompt to complete transaction
      Alert.alert(
        'Service Complete',
        'The mechanic has marked the service as complete. Please complete your transaction.',
        [
          {
            text: 'Complete Transaction',
            onPress: () => {
              navigation.navigate('TransactionCompletion', {
                requestId: serviceRequest.id,
              });
            },
          },
          { text: 'Later', style: 'cancel' },
        ]
      );
    }
  }, [serviceRequest?.mechanic_confirmed, serviceRequest?.customer_confirmed, serviceRequest?.status]);

  const handleCancel = async () => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this service request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(true);
              await serviceRequestService.cancelServiceRequest(requestId);
              Alert.alert('Success', 'Service request has been cancelled');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert(
                'Error',
                error.response?.data?.error?.message || 'Failed to cancel request'
              );
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleCallMechanic = () => {
    if (serviceRequest?.mechanic?.phone) {
      Linking.openURL(`tel:${serviceRequest.mechanic.phone}`);
    }
  };

  const getCurrentStepIndex = () => {
    if (!serviceRequest) return 0;
    return statusSteps.findIndex((step) => step.key === serviceRequest.status);
  };

  const currentStepIndex = getCurrentStepIndex();

  if (loading || !serviceRequest) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading request details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const region: Region = {
    latitude: serviceRequest.customer_location_lat || 6.5244,
    longitude: serviceRequest.customer_location_lng || 3.3792,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Service Request</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Status Steps */}
        <View style={styles.statusContainer}>
          {statusSteps.map((step, index) => {
            const isActive = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;

            return (
              <View key={step.key} style={styles.statusStep}>
                <View
                  style={[
                    styles.statusIconContainer,
                    isActive && styles.statusIconActive,
                    isCurrent && styles.statusIconCurrent,
                  ]}
                >
                  <Ionicons
                    name={step.icon as any}
                    size={24}
                    color={isActive ? '#FFFFFF' : '#8E8E93'}
                  />
                </View>
                <Text
                  style={[
                    styles.statusLabel,
                    isActive && styles.statusLabelActive,
                  ]}
                >
                  {step.label}
                </Text>
                {index < statusSteps.length - 1 && (
                  <View
                    style={[
                      styles.statusLine,
                      isActive && styles.statusLineActive,
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>

        {/* Mechanic Info Card */}
        {serviceRequest.mechanic && (
          <View style={styles.mechanicCard}>
            <View style={styles.mechanicHeader}>
              <View style={styles.mechanicInfo}>
                {serviceRequest.mechanic.profile_picture_url ? (
                  <View style={styles.mechanicImageContainer}>
                    <Text style={styles.mechanicInitial}>
                      {serviceRequest.mechanic.full_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.mechanicImagePlaceholder}>
                    <Ionicons name="person" size={32} color="#8E8E93" />
                  </View>
                )}
                <View style={styles.mechanicDetails}>
                  <Text style={styles.mechanicName}>
                    {serviceRequest.mechanic.full_name}
                  </Text>
                  <Text style={styles.mechanicPhone}>
                    {serviceRequest.mechanic.phone}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.callButton}
                onPress={handleCallMechanic}
              >
                <Ionicons name="call" size={20} color="#000000" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Request Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Request Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vehicle:</Text>
            <Text style={styles.detailValue}>
              {serviceRequest.vehicle
                ? `${serviceRequest.vehicle.car_name} ${serviceRequest.vehicle.car_model} ${serviceRequest.vehicle.car_year || ''}`
                : 'N/A'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category:</Text>
            <Text style={styles.detailValue}>
              {serviceRequest.category?.name || 'N/A'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Problem:</Text>
            <Text style={styles.detailValue}>
              {serviceRequest.problem_description}
            </Text>
          </View>
          {serviceRequest.customer_location_address && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location:</Text>
              <Text style={styles.detailValue}>
                {serviceRequest.customer_location_address}
              </Text>
            </View>
          )}
        </View>

        {/* Map */}
        {(serviceRequest.status === 'accepted' ||
          serviceRequest.status === 'in_progress') && (
          <View style={styles.mapContainer}>
            <Text style={styles.mapTitle}>Mechanic Location</Text>
            <MapView
              style={styles.map}
              // Using default provider (works in Expo Go)
              initialRegion={region}
              showsUserLocation={true}
            >
              {/* Customer location */}
              {serviceRequest.customer_location_lat &&
                serviceRequest.customer_location_lng && (
                  <Marker
                    coordinate={{
                      latitude: serviceRequest.customer_location_lat,
                      longitude: serviceRequest.customer_location_lng,
                    }}
                    title="Your Location"
                  >
                    <View style={styles.customerMarker}>
                      <View style={styles.customerMarkerInner} />
                    </View>
                  </Marker>
                )}

              {/* Mechanic location (mock) */}
              {mechanicLocation && (
                <Marker
                  coordinate={{
                    latitude: mechanicLocation.lat,
                    longitude: mechanicLocation.lng,
                  }}
                  title="Mechanic"
                >
                  <View style={styles.mechanicMarker}>
                    <Ionicons name="car" size={24} color="#000000" />
                  </View>
                </Marker>
              )}
            </MapView>
            {serviceRequest.status === 'in_progress' && (
              <View style={styles.arrivedBanner}>
                <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                <Text style={styles.arrivedText}>Mechanic has arrived</Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          {serviceRequest.mechanic_confirmed &&
            !serviceRequest.customer_confirmed &&
            serviceRequest.status === 'in_progress' && (
              <Button
                title="Complete Transaction"
                onPress={() => {
                  navigation.navigate('TransactionCompletion', {
                    requestId: serviceRequest.id,
                  });
                }}
                style={styles.completeButton}
              />
            )}
          {(serviceRequest.status === 'pending' ||
            serviceRequest.status === 'accepted') && (
            <Button
              title="Cancel Request"
              onPress={handleCancel}
              variant="outline"
              loading={cancelling}
              style={styles.cancelButton}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 24,
    backgroundColor: '#F2F2F7',
  },
  statusStep: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  statusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statusIconActive: {
    backgroundColor: '#000000',
  },
  statusIconCurrent: {
    backgroundColor: '#000000',
    borderWidth: 3,
    borderColor: '#34C759',
  },
  statusLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  statusLabelActive: {
    color: '#000000',
    fontWeight: '600',
  },
  statusLine: {
    position: 'absolute',
    top: 24,
    left: '50%',
    width: '100%',
    height: 2,
    backgroundColor: '#E5E5EA',
    zIndex: -1,
  },
  statusLineActive: {
    backgroundColor: '#000000',
  },
  mechanicCard: {
    backgroundColor: '#F2F2F7',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  mechanicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mechanicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  mechanicPhone: {
    fontSize: 14,
    color: '#8E8E93',
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#000000',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#000000',
  },
  mapContainer: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  map: {
    height: 300,
  },
  customerMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerMarkerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  mechanicMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrivedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    padding: 12,
  },
  arrivedText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  completeButton: {
    marginBottom: 8,
  },
  cancelButton: {
    borderColor: '#FF3B30',
  },
});

