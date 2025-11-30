import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../common/Button';
import Slider from '@react-native-community/slider';
import { mechanicService, Category } from '../../services/mechanicService';

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  initialFilters?: FilterState;
}

export interface FilterState {
  selectedCategories: string[];
  distance: number;
  minRating: number;
}

export const FilterBottomSheet: React.FC<FilterBottomSheetProps> = ({
  visible,
  onClose,
  onApply,
  initialFilters,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialFilters?.selectedCategories || []
  );
  const [distance, setDistance] = useState<number>(
    initialFilters?.distance || 10
  );
  const [minRating, setMinRating] = useState<number>(
    initialFilters?.minRating || 0
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadCategories();
      if (initialFilters) {
        setSelectedCategories(initialFilters.selectedCategories);
        setDistance(initialFilters.distance);
        setMinRating(initialFilters.minRating);
      }
    }
  }, [visible, initialFilters]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await mechanicService.getCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryName: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryName)) {
        return prev.filter((c) => c !== categoryName);
      } else {
        return [...prev, categoryName];
      }
    });
  };

  const handleApply = () => {
    onApply({
      selectedCategories,
      distance,
      minRating,
    });
    onClose();
  };

  const handleReset = () => {
    setSelectedCategories([]);
    setDistance(10);
    setMinRating(0);
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

              <View style={styles.header}>
                <Text style={styles.title}>Filter Mechanics</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#000000" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Categories Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Specialization</Text>
                  <View style={styles.categoriesContainer}>
                    {loading ? (
                      <Text style={styles.loadingText}>Loading categories...</Text>
                    ) : (
                      categories.map((category) => (
                        <TouchableOpacity
                          key={category.id}
                          style={[
                            styles.categoryChip,
                            selectedCategories.includes(category.name) &&
                              styles.categoryChipSelected,
                          ]}
                          onPress={() => toggleCategory(category.name)}
                        >
                          <Text
                            style={[
                              styles.categoryText,
                              selectedCategories.includes(category.name) &&
                                styles.categoryTextSelected,
                            ]}
                          >
                            {category.name}
                          </Text>
                          {selectedCategories.includes(category.name) && (
                            <Ionicons
                              name="checkmark"
                              size={16}
                              color="#000000"
                              style={styles.checkIcon}
                            />
                          )}
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                </View>

                {/* Distance Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Distance: {distance} km
                  </Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={1}
                    maximumValue={20}
                    step={1}
                    value={distance}
                    onValueChange={setDistance}
                    minimumTrackTintColor="#000000"
                    maximumTrackTintColor="#E5E5EA"
                    thumbTintColor="#000000"
                  />
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabel}>1 km</Text>
                    <Text style={styles.sliderLabel}>20 km</Text>
                  </View>
                </View>

                {/* Minimum Rating Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Minimum Rating: {minRating.toFixed(1)} ⭐
                  </Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={5}
                    step={0.1}
                    value={minRating}
                    onValueChange={setMinRating}
                    minimumTrackTintColor="#000000"
                    maximumTrackTintColor="#E5E5EA"
                    thumbTintColor="#000000"
                  />
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabel}>0 ⭐</Text>
                    <Text style={styles.sliderLabel}>5 ⭐</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actions}>
                  <Button
                    title="Reset"
                    onPress={handleReset}
                    variant="outline"
                    style={styles.resetButton}
                  />
                  <Button
                    title="Apply Filters"
                    onPress={handleApply}
                    style={styles.applyButton}
                  />
                </View>
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
    maxHeight: '85%',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  categoryChipSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  categoryText: {
    fontSize: 14,
    color: '#000000',
  },
  categoryTextSelected: {
    color: '#FFFFFF',
  },
  checkIcon: {
    marginLeft: 6,
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    marginTop: 8,
  },
  resetButton: {
    flex: 1,
  },
  applyButton: {
    flex: 2,
  },
});

