import { create } from 'zustand';
import { Location } from '../types';

interface LocationState {
  currentLocation: Location | null;
  locationPermissionGranted: boolean;
  setCurrentLocation: (location: Location) => void;
  setLocationPermission: (granted: boolean) => void;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  currentLocation: null,
  locationPermissionGranted: false,
  setCurrentLocation: (location) => set({ currentLocation: location }),
  setLocationPermission: (granted) => set({ locationPermissionGranted: granted }),
  clearLocation: () => set({ currentLocation: null, locationPermissionGranted: false }),
}));

