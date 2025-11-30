import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export interface ImagePickerResult {
  uri: string;
  type: string;
  name: string;
}

export const useImagePicker = () => {
  const [loading, setLoading] = useState(false);

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera roll permissions to upload images!'
        );
        return false;
      }
    }
    return true;
  };

  const pickImage = async (): Promise<ImagePickerResult | null> => {
    try {
      setLoading(true);
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      if (!asset) {
        return null;
      }

      // Extract file name from URI or generate one
      const uriParts = asset.uri.split('/');
      const fileName = uriParts[uriParts.length - 1] || `image_${Date.now()}.jpg`;

      return {
        uri: asset.uri,
        type: 'image/jpeg',
        name: fileName,
      };
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async (): Promise<ImagePickerResult | null> => {
    try {
      setLoading(true);
      
      // Request camera permissions
      if (Platform.OS !== 'web') {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraStatus !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Sorry, we need camera permissions to take photos!'
          );
          return null;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      if (!asset) {
        return null;
      }

      const uriParts = asset.uri.split('/');
      const fileName = uriParts[uriParts.length - 1] || `photo_${Date.now()}.jpg`;

      return {
        uri: asset.uri,
        type: 'image/jpeg',
        name: fileName,
      };
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    pickImage,
    takePhoto,
    loading,
  };
};

