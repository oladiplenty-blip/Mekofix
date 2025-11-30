import { apiClient } from './api';
import { ServiceRequest, Vehicle } from '../types';

export interface CreateServiceRequestData {
  mechanic_id: string;
  vehicle_id: string;
  category_id: string;
  problem_description: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
}

export interface CreateServiceRequestResponse {
  success: boolean;
  data: ServiceRequest;
}

export interface GetServiceRequestResponse {
  success: boolean;
  data: ServiceRequest;
}

export interface CancelServiceRequestResponse {
  success: boolean;
  data: ServiceRequest;
}

export interface CompleteServiceRequestData {
  material_cost: number;
  labor_cost: number;
  rating: number;
  review?: string;
}

export interface CompleteServiceRequestResponse {
  success: boolean;
  data: ServiceRequest;
}

export interface ServiceRequestsResponse {
  success: boolean;
  data: ServiceRequest[];
}

export interface AcceptServiceRequestResponse {
  success: boolean;
  data: ServiceRequest;
}

export interface DeclineServiceRequestResponse {
  success: boolean;
  data: ServiceRequest;
}

export interface MarkArrivedResponse {
  success: boolean;
  data: ServiceRequest;
}

export interface CompleteServiceRequestMechanicResponse {
  success: boolean;
  data: ServiceRequest;
}

export const serviceRequestService = {
  async createServiceRequest(
    data: CreateServiceRequestData
  ): Promise<CreateServiceRequestResponse> {
    const response = await apiClient.post<CreateServiceRequestResponse>(
      '/service-requests',
      data
    );
    return response.data;
  },

  async getServiceRequest(id: string): Promise<GetServiceRequestResponse> {
    const response = await apiClient.get<GetServiceRequestResponse>(
      `/service-requests/${id}`
    );
    return response.data;
  },

  async getServiceRequests(): Promise<ServiceRequestsResponse> {
    const response = await apiClient.get<ServiceRequestsResponse>(
      '/service-requests'
    );
    return response.data;
  },

  async cancelServiceRequest(
    id: string
  ): Promise<CancelServiceRequestResponse> {
    const response = await apiClient.put<CancelServiceRequestResponse>(
      `/service-requests/${id}/cancel`
    );
    return response.data;
  },

  async completeServiceRequest(
    id: string,
    data: CompleteServiceRequestData
  ): Promise<CompleteServiceRequestResponse> {
    const response = await apiClient.put<CompleteServiceRequestResponse>(
      `/service-requests/${id}/complete`,
      data
    );
    return response.data;
  },

  // Mechanic-specific methods
  async acceptServiceRequest(
    id: string
  ): Promise<AcceptServiceRequestResponse> {
    const response = await apiClient.put<AcceptServiceRequestResponse>(
      `/mechanics/requests/${id}/accept`
    );
    return response.data;
  },

  async declineServiceRequest(
    id: string
  ): Promise<DeclineServiceRequestResponse> {
    const response = await apiClient.put<DeclineServiceRequestResponse>(
      `/mechanics/requests/${id}/decline`
    );
    return response.data;
  },

  async markArrived(id: string): Promise<MarkArrivedResponse> {
    const response = await apiClient.put<MarkArrivedResponse>(
      `/mechanics/requests/${id}/arrived`
    );
    return response.data;
  },

  async completeServiceRequestMechanic(
    id: string
  ): Promise<CompleteServiceRequestMechanicResponse> {
    const response = await apiClient.put<CompleteServiceRequestMechanicResponse>(
      `/mechanics/requests/${id}/complete`
    );
    return response.data;
  },
};

