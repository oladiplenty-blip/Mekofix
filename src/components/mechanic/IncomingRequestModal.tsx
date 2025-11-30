import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { ServiceRequest } from '../../types';
import { serviceRequestService } from '../../services/serviceRequestService';
import * as Location from 'expo-location';

interface IncomingRequestModalProps {
  visible: boolean;
  request: ServiceRequest | null;
  mechanicLocation: { latitude: number; longitude: number } | null;
  onAccept: (request: ServiceRequest) => void;
  onDecline: () => void;
  onClose: () => void;
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const IncomingRequestModal: React.FC<IncomingRequestModalProps> = ({
  visible,
  request,
  mechanicLocation,
  onAccept,
  onDecline,
  onClose,
}) => {
  const [processing, setProcessing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Sound/vibration alert when modal opens
  useEffect(() => {
    if (visible && request) {
      // Trigger vibration (if available)
      if ('vibrate' in navigator) {
        // Pattern: vibrate for 200ms, pause 100ms, vibrate 200ms
        (navigator as any).vibrate([200, 100, 200]);
      }

      // Reset timer
      setTimeRemaining(60);
    }
  }, [visible, request]);

  // Auto-decline countdown
  useEffect(() => {
    if (visible && request) {
      countdownRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleDecline();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [visible, request]);

  const handleAccept = async () => {
    if (!request || processing) return;

    try {
      setProcessing(true);
      const response = await serviceRequestService.acceptServiceRequest(
        request.id
      );
      if (response.success) {
        onAccept(response.data);
        onClose();
      }
    } catch (error: any) {
      console.error('Error accepting request:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error?.message || 'Failed to accept request'
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!request || processing) return;

    try {
      setProcessing(true);
      await serviceRequestService.declineServiceRequest(request.id);
      onDecline();
      onClose();
    } catch (error: any) {
      console.error('Error declining request:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error?.message || 'Failed to decline request'
      );
    } finally {
      setProcessing(false);
    }
  };

  if (!request) return null;

  const customerLocation =
    request.customer_location_lat && request.customer_location_lng
      ? {
          latitude: request.customer_location_lat,
          longitude: request.customer_location_lng,
        }
      : null;

  const distance = mechanicLocation && customerLocation
    ? calculateDistance(
        mechanicLocation.latitude,
        mechanicLocation.longitude,
        customerLocation.latitude,
        customerLocation.longitude
      )
    : null;

  const mapRegion: Region | undefined = customerLocation
    ? {
        latitude: customerLocation.latitude,
        longitude: customerLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : undefined;

  // Get customer info (assuming it's in the request object)
  const customerName = (request as any).customer?.full_name || 'Customer';
  const customerPhoto = (request as any).customer?.profile_picture_url;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>New Service Request</Text>
              <Text style={styles.timerText}>{timeRemaining}s</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000000" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Customer Info */}
            <View style={styles.customerSection}>
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
                  {distance !== null && (
                    <Text style={styles.distanceText}>
                      {distance.toFixed(1)} km away
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Vehicle Info */}
            {request.vehicle && (
              <View style={styles.vehicleSection}>
                <Ionicons
                  name="car-outline"
                  size={20}
                  color="#8E8E93"
                  style={styles.sectionIcon}
                />
                <View style={styles.vehicleInfo}>
                  <Text style={styles.vehicleText}>
                    {request.vehicle.car_name} {request.vehicle.car_model}
                    {request.vehicle.car_year
                      ? ` (${request.vehicle.car_year})`
                      : ''}
                  </Text>
                </View>
              </View>
            )}

            {/* Problem Category */}
            {request.category && (
              <View style={styles.categorySection}>
                <Ionicons
                  name="construct-outline"
                  size={20}
                  color="#8E8E93"
                  style={styles.sectionIcon}
                />
                <Text style={styles.categoryText}>{request.category.name}</Text>
              </View>
            )}

            {/* Problem Description */}
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionLabel}>Problem Description</Text>
              <Text style={styles.descriptionText}>
                {request.problem_description}
              </Text>
            </View>

            {/* Mini Map */}
            {customerLocation && mapRegion && (
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  // Using default provider (works in Expo Go)
                  initialRegion={mapRegion}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  pitchEnabled={false}
                  rotateEnabled={false}
                >
                  <Marker
                    coordinate={customerLocation}
                    title="Customer Location"
                  >
                    <View style={styles.customerMarker}>
                      <Ionicons name="location" size={24} color="#FF3B30" />
                    </View>
                  </Marker>
                  {mechanicLocation && (
                    <Marker
                      coordinate={mechanicLocation}
                      title="Your Location"
                    >
                      <View style={styles.mechanicMarker}>
                        <Ionicons name="location" size={24} color="#007AFF" />
                      </View>
                    </Marker>
                  )}
                </MapView>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.declineButton]}
                onPress={handleDecline}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="close-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.declineButtonText}>Decline</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.acceptButton]}
                onPress={handleAccept}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  content: {
    padding: 16,
  },
  customerSection: {
    marginBottom: 16,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  customerPhotoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
  distanceText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  vehicleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  sectionIcon: {
    marginRight: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleText: {
    fontSize: 16,
    color: '#000000',
  },
  categorySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  categoryText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  descriptionSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  descriptionText: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  map: {
    flex: 1,
  },
  customerMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mechanicMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  declineButton: {
    backgroundColor: '#8E8E93',
  },
  acceptButton: {
    backgroundColor: '#34C759',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

