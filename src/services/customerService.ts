import { apiClient } from './api';
import { Vehicle } from '../types';

export interface VehiclesResponse {
  success: boolean;
  data: Vehicle[];
}

export interface UpdateProfileData {
  full_name: string;
  email: string;
  phone: string;
  gender: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  data: {
    id: string;
    email: string;
    phone: string;
    full_name: string;
    user_type: string;
    profile_picture_url?: string;
    is_verified: boolean;
    is_active: boolean;
    gender: string;
  };
}

export const customerService = {
  async getVehicles(): Promise<VehiclesResponse> {
    const response = await apiClient.get<VehiclesResponse>('/customer/vehicles');
    return response.data;
  },

  async updateProfile(data: UpdateProfileData): Promise<UpdateProfileResponse> {
    const response = await apiClient.put<UpdateProfileResponse>('/customer/profile', data);
    return response.data;
  },
};

