import { apiClient } from './api';
import { Mechanic } from '../types';

export interface NearbyMechanicsParams {
  lat: number;
  lng: number;
  radius?: number;
  specialization?: string;
}

export interface NearbyMechanicsResponse {
  success: boolean;
  data: Mechanic[];
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
}

export interface CategoriesResponse {
  success: boolean;
  data: Category[];
}

export interface AvailabilityResponse {
  success: boolean;
  data: {
    is_available: boolean;
  };
}

export interface MechanicStats {
  today_earnings: number;
  today_jobs: number;
  total_jobs: number;
  rating: number;
  wallet_balance: number;
  is_available: boolean;
}

export interface MechanicStatsResponse {
  success: boolean;
  data: MechanicStats;
}

export interface LocationUpdateParams {
  lat: number;
  lng: number;
}

export interface LocationUpdateResponse {
  success: boolean;
  data: {
    location_lat: number;
    location_lng: number;
  };
}

export const mechanicService = {
  async getNearbyMechanics(
    params: NearbyMechanicsParams
  ): Promise<NearbyMechanicsResponse> {
    const response = await apiClient.get<NearbyMechanicsResponse>(
      '/mechanics/nearby',
      { params }
    );
    return response.data;
  },

  async getCategories(): Promise<CategoriesResponse> {
    const response = await apiClient.get<CategoriesResponse>('/mechanics/categories');
    return response.data;
  },

  async toggleAvailability(): Promise<AvailabilityResponse> {
    const response = await apiClient.put<AvailabilityResponse>(
      '/mechanics/availability'
    );
    return response.data;
  },

  async getStats(): Promise<MechanicStatsResponse> {
    const response = await apiClient.get<MechanicStatsResponse>(
      '/mechanics/stats'
    );
    return response.data;
  },

  async updateLocation(
    params: LocationUpdateParams
  ): Promise<LocationUpdateResponse> {
    const response = await apiClient.put<LocationUpdateResponse>(
      '/mechanics/location',
      params
    );
    return response.data;
  },
};

