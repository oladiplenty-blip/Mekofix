import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { mechanicService } from '../services/mechanicService';

interface UseMechanicLocationOptions {
  enabled: boolean;
  interval?: number; // in milliseconds, default 30000 (30 seconds)
}

export const useMechanicLocation = ({
  enabled,
  interval = 30000,
}: UseMechanicLocationOptions) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      // Clear interval if disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Request location permission
    const requestPermission = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Location permission not granted');
          return;
        }
      } catch (error) {
        console.error('Error requesting location permission:', error);
      }
    };

    // Update location function
    const updateLocation = async () => {
      // Prevent concurrent updates
      if (isUpdatingRef.current) {
        return;
      }

      try {
        isUpdatingRef.current = true;

        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        await mechanicService.updateLocation({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        });
      } catch (error) {
        console.error('Error updating mechanic location:', error);
      } finally {
        isUpdatingRef.current = false;
      }
    };

    // Initial permission request and location update
    requestPermission().then(() => {
      updateLocation();
    });

    // Set up interval for periodic updates
    intervalRef.current = setInterval(() => {
      updateLocation();
    }, interval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval]);
};

