import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { ServiceRequest } from '../types';

interface UseIncomingRequestsOptions {
  enabled: boolean;
  onNewRequest?: (request: ServiceRequest) => void;
}

export const useIncomingRequests = ({
  enabled,
  onNewRequest,
}: UseIncomingRequestsOptions) => {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !user?.id || !supabase) {
      return;
    }

    // Set up Supabase Realtime subscription
    const channel = supabase
      .channel('mechanic-incoming-requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'service_requests',
          filter: `mechanic_id=eq.${user.id}`,
        },
        (payload) => {
          const newRequest = payload.new as any;
          
          // Only handle pending requests
          if (newRequest.status === 'pending') {
            const serviceRequest: ServiceRequest = {
              id: newRequest.id,
              customer_id: newRequest.customer_id,
              mechanic_id: newRequest.mechanic_id,
              vehicle_id: newRequest.vehicle_id,
              category_id: newRequest.category_id,
              problem_description: newRequest.problem_description,
              customer_location_lat: newRequest.customer_location_lat,
              customer_location_lng: newRequest.customer_location_lng,
              customer_location_address: newRequest.customer_location_address,
              status: newRequest.status,
              material_cost: newRequest.material_cost,
              labor_cost: newRequest.labor_cost,
              total_cost: newRequest.total_cost,
              created_at: newRequest.created_at,
              updated_at: newRequest.updated_at,
              completed_at: newRequest.completed_at,
            };

            setRequests((prev) => [serviceRequest, ...prev]);
            
            if (onNewRequest) {
              onNewRequest(serviceRequest);
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to incoming service requests');
        } else if (status === 'CHANNEL_ERROR') {
          setError('Failed to subscribe to incoming requests');
        }
      });

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, user?.id, onNewRequest]);

  return { requests, loading, error };
};

