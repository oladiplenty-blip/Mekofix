// TypeScript type definitions
// Export all types from here

export type UserType = 'customer' | 'mechanic' | 'vendor' | 'admin';

export interface User {
  id: string;
  email: string;
  phone: string;
  user_type: UserType;
  full_name: string;
  profile_picture_url?: string;
  is_verified: boolean;
  is_active: boolean;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface Vehicle {
  id: string;
  customer_id: string;
  car_name: string;
  car_model: string;
  car_year?: number;
  is_primary?: boolean;
}

export interface ServiceRequest {
  id: string;
  customer_id: string;
  mechanic_id?: string;
  vehicle_id: string;
  category_id: string;
  problem_description: string;
  customer_location_lat?: number;
  customer_location_lng?: number;
  customer_location_address?: string;
  customer_location?: Location;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  material_cost?: number;
  labor_cost?: number;
  total_cost?: number;
  created_at: string;
  updated_at?: string;
  completed_at?: string;
  arrived_at?: string;
  mechanic_confirmed?: boolean;
  customer_confirmed?: boolean;
  mechanic?: {
    id: string;
    full_name: string;
    profile_picture_url?: string;
    phone: string;
  };
  customer?: {
    id: string;
    full_name: string;
    profile_picture_url?: string;
    phone: string;
  };
  vehicle?: Vehicle;
  category?: {
    id: string;
    name: string;
  };
}

export interface Product {
  id: string;
  vendor_id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  images: string[];
  is_available: boolean;
}

export interface Mechanic {
  id: number | string;
  name: string;
  rating: number;
  specializations: string[];
  latitude: number;
  longitude: number;
  profile_photo?: string;
  profile_picture_url?: string;
  is_available?: boolean;
  total_jobs?: number;
  distance?: number;
}

