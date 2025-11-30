import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../common/Button';
import { Mechanic } from '../../types';

interface MechanicBottomSheetProps {
  visible: boolean;
  mechanic: Mechanic | null;
  onClose: () => void;
  onRequestService: (mechanic: Mechanic) => void;
}

export const MechanicBottomSheet: React.FC<MechanicBottomSheetProps> = ({
  visible,
  mechanic,
  onClose,
  onRequestService,
}) => {
  if (!mechanic) return null;

  const handleRequestService = () => {
    onClose();
    onRequestService(mechanic);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.bottomSheet}>
              <View style={styles.handle} />
              
              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                  <View style={styles.profileSection}>
                    {mechanic.profile_photo || mechanic.profile_picture_url ? (
                      <Image
                        source={{ uri: mechanic.profile_photo || mechanic.profile_picture_url }}
                        style={styles.profileImage}
                      />
                    ) : (
                      <View style={styles.profilePlaceholder}>
                        <Ionicons name="person" size={40} color="#8E8E93" />
                      </View>
                    )}
                    <View style={styles.profileInfo}>
                      <Text style={styles.name}>{mechanic.name}</Text>
                      <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={16} color="#FF9500" />
                        <Text style={styles.rating}>{mechanic.rating}</Text>
                        {mechanic.total_jobs && (
                          <Text style={styles.jobsCount}>
                            {' '}• {mechanic.total_jobs} jobs
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="#000000" />
                  </TouchableOpacity>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Specializations</Text>
                  <View style={styles.specializationsContainer}>
                    {mechanic.specializations.map((spec, index) => (
                      <View key={index} style={styles.specializationTag}>
                        <Text style={styles.specializationText}>{spec}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {mechanic.is_available === false && (
                  <View style={styles.unavailableContainer}>
                    <Ionicons name="time-outline" size={20} color="#FF3B30" />
                    <Text style={styles.unavailableText}>
                      Currently unavailable
                    </Text>
                  </View>
                )}

                <Button
                  title="Request Service"
                  onPress={handleRequestService}
                  disabled={mechanic.is_available === false}
                  style={styles.requestButton}
                />
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#C6C6C8',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  profileSection: {
    flexDirection: 'row',
    flex: 1,
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
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 16,
    color: '#000000',
    marginLeft: 4,
    fontWeight: '500',
  },
  jobsCount: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 4,
  },
  closeButton: {
    padding: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  specializationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specializationTag: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  specializationText: {
    fontSize: 14,
    color: '#000000',
  },
  unavailableContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  unavailableText: {
    fontSize: 14,
    color: '#FF3B30',
    marginLeft: 8,
  },
  requestButton: {
    marginTop: 8,
  },
});

