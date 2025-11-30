import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MechanicStackParamList, MechanicTabsParamList } from '../../navigation/types';
import { DrawerMenu } from '../../components/common/DrawerMenu';
import { IncomingRequestModal } from '../../components/mechanic/IncomingRequestModal';
import { mechanicService, MechanicStats } from '../../services/mechanicService';
import { useMechanicLocation } from '../../hooks/useMechanicLocation';
import { useIncomingRequests } from '../../hooks/useIncomingRequests';
import { serviceRequestService } from '../../services/serviceRequestService';
import { ServiceRequest } from '../../types';

type MechanicHomeScreenNavigationProp = StackNavigationProp<
  MechanicStackParamList
>;

export const MechanicHomeScreen: React.FC = () => {
  const navigation = useNavigation<MechanicHomeScreenNavigationProp>();
  const mapRef = useRef<MapView>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MechanicStats | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 6.5244, // Default to Lagos, Nigeria
    longitude: 3.3792,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [togglingAvailability, setTogglingAvailability] = useState(false);
  const [incomingRequest, setIncomingRequest] = useState<ServiceRequest | null>(null);
  const [incomingModalVisible, setIncomingModalVisible] = useState(false);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Update location periodically when available
  useMechanicLocation({
    enabled: isAvailable,
    interval: 30000, // 30 seconds
  });

  // Listen for incoming requests when available
  useIncomingRequests({
    enabled: isAvailable,
    onNewRequest: async (request: ServiceRequest) => {
      // Fetch full request details with customer info
      try {
        const response = await serviceRequestService.getServiceRequest(request.id);
        if (response.success) {
          setIncomingRequest(response.data);
          setIncomingModalVisible(true);
        }
      } catch (error) {
        console.error('Error fetching request details:', error);
        // Fallback to basic request
        setIncomingRequest(request);
        setIncomingModalVisible(true);
      }
    },
  });

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Request location permission and get current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const userLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setCurrentLocation(userLocation);
        const newRegion: Region = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setRegion(newRegion);
      }

      // Load stats
      await loadStats();
    } catch (error) {
      console.error('Error loading initial data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await mechanicService.getStats();
      if (response.success) {
        setStats(response.data);
        setIsAvailable(response.data.is_available);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleToggleAvailability = async () => {
    try {
      setTogglingAvailability(true);
      const response = await mechanicService.toggleAvailability();
      if (response.success) {
        setIsAvailable(response.data.is_available);
        // Reload stats when toggling
        await loadStats();
      }
    } catch (error: any) {
      console.error('Error toggling availability:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error?.message || 'Failed to update availability'
      );
    } finally {
      setTogglingAvailability(false);
    }
  };

  const centerOnUserLocation = () => {
    if (currentLocation) {
      const newRegion: Region = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      mapRef.current?.animateToRegion(newRegion, 1000);
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          // Using default provider (works in Expo Go)
          initialRegion={region}
          showsUserLocation={true}
          showsMyLocationButton={false}
          followsUserLocation={false}
        >
          {/* Mechanic location marker */}
          {currentLocation && (
            <Marker
              coordinate={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              }}
              title="Your Location"
            >
              <View style={styles.mechanicMarker}>
                <View
                  style={[
                    styles.mechanicMarkerInner,
                    isAvailable && styles.mechanicMarkerActive,
                  ]}
                />
              </View>
            </Marker>
          )}
        </MapView>

        {/* Top bar with menu and availability toggle */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setDrawerVisible(true)}
          >
            <Ionicons name="menu" size={24} color="#000000" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.availabilityToggle,
              isAvailable ? styles.availabilityToggleOn : styles.availabilityToggleOff,
            ]}
            onPress={handleToggleAvailability}
            disabled={togglingAvailability}
          >
            {togglingAvailability ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <View
                  style={[
                    styles.availabilityIndicator,
                    isAvailable ? styles.availabilityIndicatorOn : styles.availabilityIndicatorOff,
                  ]}
                />
                <Text style={styles.availabilityText}>
                  {isAvailable ? "You're Online" : "You're Offline"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Stats bar */}
        {stats && (
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                ₦{stats.today_earnings.toFixed(2)}
              </Text>
              <Text style={styles.statLabel}>Today's Earnings</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.today_jobs}</Text>
              <Text style={styles.statLabel}>Jobs Today</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {stats.rating > 0 ? stats.rating.toFixed(1) : 'N/A'}
              </Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        )}

        {/* Floating action button to center on user */}
        {currentLocation && (
          <TouchableOpacity style={styles.fab} onPress={centerOnUserLocation}>
            <Ionicons name="locate" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Drawer Menu */}
      <DrawerMenu
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Incoming Request Modal */}
      <IncomingRequestModal
        visible={incomingModalVisible}
        request={incomingRequest}
        mechanicLocation={currentLocation}
        onAccept={(request) => {
          // Navigate to ActiveJobScreen
          navigation.navigate('ActiveJob', { requestId: request.id });
        }}
        onDecline={() => {
          setIncomingRequest(null);
        }}
        onClose={() => {
          setIncomingModalVisible(false);
          setIncomingRequest(null);
        }}
      />
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
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 8,
    zIndex: 1,
  },
  menuButton: {
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
    marginRight: 8,
  },
  availabilityToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  availabilityToggleOn: {
    backgroundColor: '#34C759', // Green
  },
  availabilityToggleOff: {
    backgroundColor: '#8E8E93', // Gray
  },
  availabilityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  availabilityIndicatorOn: {
    backgroundColor: '#FFFFFF',
  },
  availabilityIndicatorOff: {
    backgroundColor: '#FFFFFF',
  },
  availabilityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 120,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  mechanicMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mechanicMarkerInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  mechanicMarkerActive: {
    backgroundColor: '#34C759',
  },
});

