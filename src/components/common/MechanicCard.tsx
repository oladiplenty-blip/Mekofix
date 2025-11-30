import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Mechanic } from '../../types';

interface MechanicCardProps {
  mechanic: Mechanic;
  onPress: (mechanic: Mechanic) => void;
}

export const MechanicCard: React.FC<MechanicCardProps> = ({
  mechanic,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(mechanic)}
      activeOpacity={0.7}
    >
      {mechanic.profile_photo ? (
        <Image
          source={{ uri: mechanic.profile_photo }}
          style={styles.profileImage}
        />
      ) : (
        <View style={styles.profilePlaceholder}>
          <Ionicons name="person" size={32} color="#8E8E93" />
        </View>
      )}

      <View style={styles.info}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {mechanic.name}
          </Text>
          {mechanic.is_available !== false && (
            <View style={styles.availableBadge}>
              <Text style={styles.availableText}>Available</Text>
            </View>
          )}
        </View>

        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#FF9500" />
          <Text style={styles.rating}>{mechanic.rating}</Text>
          {mechanic.total_jobs && (
            <Text style={styles.jobsCount}>
              {' '}• {mechanic.total_jobs} jobs
            </Text>
          )}
          {mechanic.distance && (
            <Text style={styles.distance}>
              {' '}• {mechanic.distance} km away
            </Text>
          )}
        </View>

        <View style={styles.specializationsContainer}>
          {mechanic.specializations.slice(0, 3).map((spec, index) => (
            <View key={index} style={styles.specTag}>
              <Text style={styles.specText}>{spec}</Text>
            </View>
          ))}
          {mechanic.specializations.length > 3 && (
            <Text style={styles.moreSpecs}>
              +{mechanic.specializations.length - 3} more
            </Text>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  profilePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    marginRight: 8,
  },
  availableBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  availableText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    fontSize: 14,
    color: '#000000',
    marginLeft: 4,
    fontWeight: '500',
  },
  jobsCount: {
    fontSize: 12,
    color: '#8E8E93',
  },
  distance: {
    fontSize: 12,
    color: '#8E8E93',
  },
  specializationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  specTag: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  specText: {
    fontSize: 12,
    color: '#000000',
  },
  moreSpecs: {
    fontSize: 12,
    color: '#8E8E93',
  },
});

