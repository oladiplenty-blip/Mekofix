import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Mechanic } from '../../types';

interface MechanicMarkerProps {
  mechanic: Mechanic;
  onPress: (mechanic: Mechanic) => void;
}

const getMarkerIcon = (specializations: string[]): string => {
  // Return different icons based on specialization
  if (specializations.some((s) => s.toLowerCase().includes('engine'))) {
    return '🔧'; // Engine icon
  } else if (specializations.some((s) => s.toLowerCase().includes('electrical'))) {
    return '⚡'; // Electrical icon
  } else if (specializations.some((s) => s.toLowerCase().includes('body'))) {
    return '🚗'; // Body work icon
  } else if (specializations.some((s) => s.toLowerCase().includes('ac'))) {
    return '❄️'; // AC icon
  }
  return '🔩'; // Default wrench icon
};

export const MechanicMarker: React.FC<MechanicMarkerProps> = ({
  mechanic,
  onPress,
}) => {
  return (
    <Marker
      coordinate={{
        latitude: mechanic.latitude,
        longitude: mechanic.longitude,
      }}
      onPress={() => onPress(mechanic)}
      title={mechanic.name}
      description={`Rating: ${mechanic.rating} ⭐`}
    >
      <View style={styles.markerContainer}>
        <View style={styles.markerIcon}>
          <Text style={styles.iconText}>
            {getMarkerIcon(mechanic.specializations)}
          </Text>
        </View>
        {mechanic.is_available !== false && (
          <View style={styles.availableIndicator} />
        )}
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  iconText: {
    fontSize: 20,
  },
  availableIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginTop: -8,
    marginLeft: 24,
  },
});

