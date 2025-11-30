import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useImagePicker, ImagePickerResult } from '../../hooks/useImagePicker';
import { Button } from '../common';

interface FileUploadProps {
  label: string;
  value?: ImagePickerResult | null;
  onChange: (file: ImagePickerResult | null) => void;
  error?: string;
  required?: boolean;
  allowCamera?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  value,
  onChange,
  error,
  required = false,
  allowCamera = false,
}) => {
  const { pickImage, takePhoto, loading } = useImagePicker();

  const handlePickImage = async () => {
    const result = await pickImage();
    if (result) {
      onChange(result);
    }
  };

  const handleTakePhoto = async () => {
    const result = await takePhoto();
    if (result) {
      onChange(result);
    }
  };

  const showImageOptions = () => {
    if (allowCamera) {
      Alert.alert(
        'Select Image',
        'Choose an option',
        [
          { text: 'Camera', onPress: handleTakePhoto },
          { text: 'Gallery', onPress: handlePickImage },
          { text: 'Cancel', style: 'cancel' },
        ],
        { cancelable: true }
      );
    } else {
      handlePickImage();
    }
  };

  const handleRemove = () => {
    onChange(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>

      {value ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: value.uri }} style={styles.previewImage} />
          <View style={styles.previewActions}>
            <TouchableOpacity
              style={styles.changeButton}
              onPress={showImageOptions}
              disabled={loading}
            >
              <Text style={styles.changeButtonText}>Change</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={handleRemove}
              disabled={loading}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.uploadButton, error && styles.uploadButtonError]}
          onPress={showImageOptions}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <Text style={styles.uploadButtonText}>
              {allowCamera ? 'Take Photo or Choose from Gallery' : 'Choose File'}
            </Text>
          )}
        </TouchableOpacity>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  uploadButton: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9F9F9',
    minHeight: 100,
  },
  uploadButtonError: {
    borderColor: '#FF3B30',
  },
  uploadButtonText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  previewContainer: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F9F9F9',
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  previewActions: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  changeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#000000',
    borderRadius: 6,
    alignItems: 'center',
  },
  changeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FF3B30',
    borderRadius: 6,
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
});

