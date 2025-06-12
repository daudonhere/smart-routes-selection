import { StateCreator } from 'zustand';
import { AppState, UiSlice } from '@/libs/types';
import { fetchAddressName } from '@/libs/geocoding';
import L from 'leaflet';

export const createUiSlice: StateCreator<AppState, [], [], UiSlice> = (set, get) => ({
  userLocation: null,
  isRouteLoading: false,
  isMapLoading: true,
  error: null,
  
  clearError: () => set({ error: null }),

  initializeLocation: () => {
    set({ isMapLoading: true });
    const init = async (coords: [number, number]) => {
        const name = await fetchAddressName(coords);
        set({ userLocation: coords, departurePoint: coords, departureAddress: name, isMapLoading: false, error: null });
    };
    const handleGeoError = () => {
        set({ userLocation: null, departurePoint: null, departureAddress: '', isMapLoading: false, error: "GPS is not active or permission is denied" });
    };
    if (!navigator.geolocation) {
        handleGeoError();
        return;
    }
    navigator.geolocation.getCurrentPosition(
        (position) => init([position.coords.latitude, position.coords.longitude]),
        handleGeoError,
        { timeout: 10000, enableHighAccuracy: true }
    );
  },
  
  updateLocationFromMap: async (latlng: L.LatLng, type: 'departure' | 'destination') => {
    get().cancelOffer();
    const coords: [number, number] = [latlng.lat, latlng.lng];
    const stateUpdate = type === 'departure' 
        ? { departurePoint: coords, departureAddress: 'Update Address...' } 
        : { destinationPoint: coords, destinationAddress: 'Update Address...' };
    set({ ...stateUpdate, routes: [] });
    get().clearError();
    const name = await fetchAddressName(coords);
    const finalUpdate = type === 'departure' 
        ? { departureAddress: name } 
        : { destinationAddress: name };
    set(finalUpdate);
  },
});