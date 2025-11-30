import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { serviceRequestService } from '../services/serviceRequestService';
import { ServiceRequest } from '../types';

export const useServiceRequestSubscription = (requestId: string) => {
  const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!requestId) return;

    // Initial fetch - use API if Supabase not configured
    const fetchRequest = async () => {
      try {
        if (supabase) {
          // Try Supabase first
          const { data, error } = await supabase
            .from('service_requests')
            .select('*')
            .eq('id', requestId)
            .single();

          if (error) {
            console.error('Error fetching service request from Supabase:', error);
            // Fall back to API
            const response = await serviceRequestService.getServiceRequest(requestId);
            if (response.success) {
              setServiceRequest(response.data);
            }
          } else {
            setServiceRequest(data as ServiceRequest);
          }
        } else {
          // Use API directly if Supabase not configured
          const response = await serviceRequestService.getServiceRequest(requestId);
          if (response.success) {
            setServiceRequest(response.data);
          }
        }
      } catch (error) {
        console.error('Error fetching service request:', error);
        // Fall back to API
        try {
          const response = await serviceRequestService.getServiceRequest(requestId);
          if (response.success) {
            setServiceRequest(response.data);
          }
        } catch (apiError) {
          console.error('Error fetching from API:', apiError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();

    // Subscribe to real-time updates only if Supabase is configured
    if (supabase) {
      const channel = supabase
        .channel(`service_request:${requestId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'service_requests',
            filter: `id=eq.${requestId}`,
          },
          (payload) => {
            setServiceRequest(payload.new as ServiceRequest);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      // Poll for updates if Supabase not configured (fallback)
      const pollInterval = setInterval(async () => {
        try {
          const response = await serviceRequestService.getServiceRequest(requestId);
          if (response.success) {
            setServiceRequest((prev) => {
              // Only update if status changed
              if (prev?.status !== response.data.status) {
                return response.data;
              }
              return prev;
            });
          }
        } catch (error) {
          console.error('Error polling service request:', error);
        }
      }, 5000); // Poll every 5 seconds

      return () => {
        clearInterval(pollInterval);
      };
    }
  }, [requestId]);

  return { serviceRequest, loading };
};

