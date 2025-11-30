import { apiClient } from './api';
import { User } from '../types';

export interface LoginCredentials {
  email?: string;
  phone?: string;
  password: string;
}

export interface CustomerSignupData {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
  gender: string;
  car_name?: string;
  car_model?: string;
  car_year?: number;
}

export interface MechanicSignupData {
  // Step 1: Basic Info
  full_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
  gender: string;

  // Step 2: Address & Documents
  home_address: string;
  work_address: string;
  utility_bill?: {
    uri: string;
    type: string;
    name: string;
  } | null;
  id_type: string;
  id_document?: {
    uri: string;
    type: string;
    name: string;
  } | null;
  profile_photo?: {
    uri: string;
    type: string;
    name: string;
  } | null;

  // Step 3: Guarantors
  guarantor1_name: string;
  guarantor1_phone: string;
  guarantor1_address: string;
  guarantor1_relationship: string;
  guarantor2_name: string;
  guarantor2_phone: string;
  guarantor2_address: string;
  guarantor2_relationship: string;

  // Step 4: Specializations
  specializations: string[];
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}

export interface SignupResponse {
  success: boolean;
  data: {
    message: string;
    user_id?: string;
  };
}

export interface OTPVerificationData {
  email?: string;
  phone?: string;
  code: string;
}

export interface OTPVerificationResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}

export interface ForgotPasswordData {
  email: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      '/auth/login',
      credentials
    );
    return response.data;
  },

  async registerCustomer(data: CustomerSignupData): Promise<SignupResponse> {
    const response = await apiClient.post<SignupResponse>(
      '/auth/register/customer',
      data
    );
    return response.data;
  },

  async verifyOTP(data: OTPVerificationData): Promise<OTPVerificationResponse> {
    const response = await apiClient.post<OTPVerificationResponse>(
      '/auth/verify-otp',
      data
    );
    return response.data;
  },

  async resendOTP(email?: string, phone?: string): Promise<{ success: boolean }> {
    const response = await apiClient.post('/auth/resend-otp', { email, phone });
    return response.data;
  },

  async forgotPassword(data: ForgotPasswordData): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/auth/forgot-password', data);
    return response.data;
  },

  async registerMechanic(data: MechanicSignupData): Promise<SignupResponse> {
    // Convert image picker results to base64 for upload
    // In React Native, we'll convert local file URIs to base64 data URIs
    const prepareFileForUpload = async (file: { uri: string; type: string; name: string } | null | undefined) => {
      if (!file) return null;
      
      // If it's already a data URI, use it directly
      if (file.uri.startsWith('data:')) {
        return {
          uri: file.uri,
          type: file.type,
          name: file.name,
        };
      }
      
      // For local file URIs (from expo-image-picker), we need to convert to base64
      // Note: For production, consider using expo-file-system's readAsStringAsync
      // For now, we'll attempt conversion using fetch
      try {
        // Fetch the file
        const response = await fetch(file.uri);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        
        // Convert to base64 - React Native compatible method
        // Using a simple base64 encoding that works in React Native
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        
        // Try to use btoa (available in some React Native environments)
        // If not available, the backend will handle the URI
        let base64: string;
        try {
          // @ts-ignore - btoa might not be in types but could be available
          base64 = typeof btoa !== 'undefined' ? btoa(binary) : '';
        } catch {
          base64 = '';
        }
        
        if (base64) {
          const mimeType = file.type || blob.type || 'image/jpeg';
          return {
            uri: `data:${mimeType};base64,${base64}`,
            type: mimeType,
            name: file.name,
          };
        } else {
          // If base64 conversion fails, send URI (backend can handle file:// URIs for local dev)
          // In production, you should use expo-file-system for proper base64 conversion
          console.warn('Base64 conversion not available, sending file URI. Consider using expo-file-system.');
          return {
            uri: file.uri,
            type: file.type,
            name: file.name,
          };
        }
      } catch (error) {
        console.error('Error processing file:', error);
        // Fallback: send the URI
        return {
          uri: file.uri,
          type: file.type,
          name: file.name,
        };
      }
    };

    // Prepare files for upload
    const [utilityBill, idDocument, profilePhoto] = await Promise.all([
      prepareFileForUpload(data.utility_bill),
      prepareFileForUpload(data.id_document),
      prepareFileForUpload(data.profile_photo),
    ]);

    // Prepare the request payload (exclude confirm_password)
    const { confirm_password, ...payload } = data;
    const requestData = {
      ...payload,
      utility_bill: utilityBill,
      id_document: idDocument,
      profile_photo: profilePhoto,
    };

    const response = await apiClient.post<SignupResponse>(
      '/auth/register/mechanic',
      requestData
    );
    return response.data;
  },
};

