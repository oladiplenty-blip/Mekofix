import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Text,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useLocationStore } from '../../store/locationStore';
import { SearchBar } from '../../components/common/SearchBar';
import { DrawerMenu } from '../../components/common/DrawerMenu';
import { MechanicMarker } from '../../components/maps/MechanicMarker';
import { MechanicBottomSheet } from '../../components/maps/MechanicBottomSheet';
import { FilterBottomSheet, FilterState } from '../../components/maps/FilterBottomSheet';
import { MechanicCard } from '../../components/common/MechanicCard';
import { Mechanic } from '../../types';
import { mechanicService, Category } from '../../services/mechanicService';
import { CustomerStackParamList } from '../../navigation/types';

type CustomerHomeScreenNavigationProp = StackNavigationProp<CustomerStackParamList, 'CustomerTabs'>;

type SortOption = 'distance' | 'rating' | 'jobs';

export const CustomerHomeScreen: React.FC = () => {
  const navigation = useNavigation<CustomerHomeScreenNavigationProp>();
  const mapRef = useRef<MapView>(null);
  const { currentLocation, setCurrentLocation, setLocationPermission } = useLocationStore();

  // Debug logging
  useEffect(() => {
    console.log('CustomerHomeScreen mounted');
  }, []);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedMechanic, setSelectedMechanic] = useState<Mechanic | null>(null);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [filteredMechanics, setFilteredMechanics] = useState<Mechanic[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    selectedCategories: [],
    distance: 10,
    minRating: 0,
  });
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list'); // Default to list since map needs native setup
  const [mapError, setMapError] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('distance');
  const [region, setRegion] = useState<Region>({
    latitude: 6.5244, // Default to Lagos, Nigeria
    longitude: 3.3792,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    requestLocationPermission();
    loadCategories();
  }, []);

  useEffect(() => {
    if (currentLocation) {
      const newRegion: Region = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
      loadMechanics();
    }
  }, [currentLocation]);

  useEffect(() => {
    applyFilters();
  }, [mechanics, filters, sortBy]);

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

  const loadMechanics = async () => {
    if (!currentLocation) return;

    try {
      setLoading(true);
      const response = await mechanicService.getNearbyMechanics({
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
        radius: filters.distance,
        specialization: filters.selectedCategories.length > 0
          ? filters.selectedCategories[0]
          : undefined,
      });

      if (response.success) {
        setMechanics(response.data);
      }
    } catch (error: any) {
      console.error('Error loading mechanics:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error?.message || 'Failed to load mechanics'
      );
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...mechanics];

    // Filter by selected categories
    if (filters.selectedCategories.length > 0) {
      filtered = filtered.filter((mechanic) =>
        mechanic.specializations.some((spec) =>
          filters.selectedCategories.includes(spec)
        )
      );
    }

    // Filter by minimum rating
    if (filters.minRating > 0) {
      filtered = filtered.filter((mechanic) => mechanic.rating >= filters.minRating);
    }

    // Filter by search text (category name)
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter((mechanic) =>
        mechanic.specializations.some((spec) =>
          spec.toLowerCase().includes(searchLower)
        ) || mechanic.name.toLowerCase().includes(searchLower)
      );
    }

    // Sort mechanics
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return (a.distance || 0) - (b.distance || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'jobs':
          return (b.total_jobs || 0) - (a.total_jobs || 0);
        default:
          return 0;
      }
    });

    setFilteredMechanics(filtered);
  };

  const requestLocationPermission = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to find nearby mechanics.',
          [{ text: 'OK' }]
        );
        setLocationPermission(false);
        setLoading(false);
        return;
      }

      setLocationPermission(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const userLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentLocation(userLocation);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your location');
    } finally {
      setLoading(false);
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
    } else {
      requestLocationPermission();
    }
  };

  const handleMechanicPress = (mechanic: Mechanic) => {
    setSelectedMechanic(mechanic);
    setBottomSheetVisible(true);
  };

  const handleRequestService = (mechanic: Mechanic) => {
    navigation.navigate('ServiceRequest', { mechanic });
  };

  const handleFilterApply = (newFilters: FilterState) => {
    setFilters(newFilters);
    loadMechanics();
  };

  const handleSearchSuggestionSelect = (category: string) => {
    setSearchText(category);
    setShowSearchSuggestions(false);
    // Apply category filter
    if (!filters.selectedCategories.includes(category)) {
      setFilters({
        ...filters,
        selectedCategories: [category],
      });
    }
  };

  const categoryNames = categories.map((c) => c.name);

  if (loading && !currentLocation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Auto-switch to list view if map fails
  useEffect(() => {
    if (mapError && viewMode === 'map') {
      setViewMode('list');
    }
  }, [mapError, viewMode]);

  if (mapError && viewMode === 'map') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Map unavailable. Switching to list view...</Text>
          <TouchableOpacity
            style={{ marginTop: 20, padding: 10, backgroundColor: '#000', borderRadius: 5 }}
            onPress={() => {
              setMapError(false);
              setViewMode('list');
            }}
          >
            <Text style={{ color: '#fff', textAlign: 'center' }}>View List</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            // Remove PROVIDER_GOOGLE - use default provider (Apple Maps on iOS, Google Maps on Android)
            // This works in Expo Go without native setup
            initialRegion={region}
            showsUserLocation={true}
            showsMyLocationButton={false}
            followsUserLocation={false}
            onMapReady={() => console.log('Map is ready')}
            onError={(error) => {
              console.error('MapView error:', error);
              setMapError(true);
              // Auto-switch to list view on error
              setTimeout(() => setViewMode('list'), 1000);
            }}
          >
            {/* User location marker */}
            {currentLocation && (
              <Marker
                coordinate={{
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                }}
                title="Your Location"
              >
                <View style={styles.userMarker}>
                  <View style={styles.userMarkerInner} />
                </View>
              </Marker>
            )}

            {/* Mechanic markers */}
            {filteredMechanics.map((mechanic) => (
              <MechanicMarker
                key={mechanic.id}
                mechanic={mechanic}
                onPress={handleMechanicPress}
              />
            ))}
          </MapView>

          {/* Top bar with menu and search */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setDrawerVisible(true)}
            >
              <Ionicons name="menu" size={24} color="#000000" />
            </TouchableOpacity>
            <View style={styles.searchContainer}>
              <SearchBar
                value={searchText}
                onChangeText={(text) => {
                  setSearchText(text);
                  setShowSearchSuggestions(text.length > 0);
                }}
                placeholder="Search for problem type..."
                suggestions={categoryNames}
                onSuggestionSelect={handleSearchSuggestionSelect}
                showSuggestions={showSearchSuggestions}
                onFocus={() => setShowSearchSuggestions(true)}
              />
            </View>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setFilterVisible(true)}
            >
              <Ionicons name="options" size={24} color="#000000" />
              {(filters.selectedCategories.length > 0 ||
                filters.minRating > 0 ||
                filters.distance !== 10) && (
                <View style={styles.filterBadge} />
              )}
            </TouchableOpacity>
          </View>
          
          {/* Error message for map */}
          {mapError && (
            <View style={styles.mapErrorBanner}>
              <Text style={styles.mapErrorText}>
                Map unavailable. Showing list view instead.
              </Text>
            </View>
          )}

          {/* View toggle button */}
          <TouchableOpacity
            style={styles.viewToggleButton}
            onPress={() => setViewMode('list')}
          >
            <Ionicons name="list" size={20} color="#000000" />
          </TouchableOpacity>

          {/* Floating action button to center on user */}
          <TouchableOpacity style={styles.fab} onPress={centerOnUserLocation}>
            <Ionicons name="locate" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {/* List view header */}
          <View style={styles.listHeader}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setDrawerVisible(true)}
            >
              <Ionicons name="menu" size={24} color="#000000" />
            </TouchableOpacity>
            <Text style={styles.listTitle}>Mechanics ({filteredMechanics.length})</Text>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.sortButton}
                onPress={() => {
                  const options: SortOption[] = ['distance', 'rating', 'jobs'];
                  const currentIndex = options.indexOf(sortBy);
                  const nextIndex = (currentIndex + 1) % options.length;
                  setSortBy(options[nextIndex]);
                }}
              >
                <Ionicons name="swap-vertical" size={24} color="#000000" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.filterButtonList}
                onPress={() => setFilterVisible(true)}
              >
                <Ionicons name="options" size={24} color="#000000" />
                {(filters.selectedCategories.length > 0 ||
                  filters.minRating > 0 ||
                  filters.distance !== 10) && (
                  <View style={styles.filterBadge} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Sort indicator */}
          <View style={styles.sortIndicator}>
            <Text style={styles.sortText}>
              Sorted by: {sortBy === 'distance' ? 'Distance' : sortBy === 'rating' ? 'Rating' : 'Jobs'}
            </Text>
          </View>

          {/* Mechanics list */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#000000" />
            </View>
          ) : filteredMechanics.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color="#8E8E93" />
              <Text style={styles.emptyText}>No mechanics found</Text>
              <Text style={styles.emptySubtext}>
                Try adjusting your filters or search
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
            >
              {filteredMechanics.map((mechanic) => (
                <MechanicCard
                  key={mechanic.id}
                  mechanic={mechanic}
                  onPress={handleMechanicPress}
                />
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* Drawer Menu */}
      <DrawerMenu
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={handleFilterApply}
        initialFilters={filters}
      />

      {/* Mechanic Bottom Sheet */}
      <MechanicBottomSheet
        visible={bottomSheetVisible}
        mechanic={selectedMechanic}
        onClose={() => {
          setBottomSheetVisible(false);
          setSelectedMechanic(null);
        }}
        onRequestService={handleRequestService}
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
    marginRight: 8,
  },
  searchContainer: {
    flex: 1,
  },
  filterButton: {
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
    marginLeft: 8,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  viewToggleButton: {
    position: 'absolute',
    top: 60,
    right: 16,
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
    zIndex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
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
  userMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMarkerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  listTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortButton: {
    padding: 8,
    marginRight: 4,
  },
  filterButtonList: {
    padding: 8,
    position: 'relative',
  },
  sortIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  sortText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
  mapErrorBanner: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    padding: 12,
    zIndex: 1000,
  },
  mapErrorText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});
