// src/stores/routesStore.ts

import { create } from 'zustand';
import L from 'leaflet';
import { fetchAddressName, resolveLocationToInfo } from '@/libs/geocoding';
import { fetchOptimalRoutes } from '@/libs/routing';
import { RouteInfo, TransportMode } from '@/libs/types';

interface RouteState {
  userLocation: [number, number] | null;
  departurePoint: [number, number] | null;
  destinationPoint: [number, number] | null;
  departureAddress: string;
  destinationAddress: string;
  transportMode: TransportMode;
  routes: RouteInfo[];
  includeTolls: boolean;
  isRouteLoading: boolean;
  isMapLoading: boolean;
  error: string | null;
  initializeLocation: () => void;
  setTransportMode: (mode: TransportMode) => void;
  setIncludeTolls: (include: boolean) => void;
  setDepartureFromInput: (address: string) => void;
  setDestinationFromInput: (address: string) => void;
  updateLocationFromMap: (latlng: L.LatLng, type: 'departure' | 'destination') => Promise<void>;
  fetchRoutes: () => Promise<void>;
  setActiveRoute: (routeId: string) => void;
  clearError: () => void;
}

export const useRouteStore = create<RouteState>((set, get) => ({
  userLocation: null,
  departurePoint: null,
  destinationPoint: null,
  departureAddress: '',
  destinationAddress: '',
  transportMode: 'motorbike',
  routes: [],
  includeTolls: true,
  isRouteLoading: false,
  isMapLoading: true,
  error: null,
  clearError: () => set({ error: null }),

  setTransportMode: (mode) => {
    set({ transportMode: mode, routes: [] });
    get().clearError();
  },

  setIncludeTolls: (include) => {
    set({ includeTolls: include, routes: [] });
    get().clearError();
  },

  setDepartureFromInput: (address) => set({ departureAddress: address, routes: [] }),
  setDestinationFromInput: (address) => set({ destinationAddress: address, routes: [] }),

  initializeLocation: () => {
    set({ isMapLoading: true });
    const init = async (coords: [number, number]) => {
      const name = await fetchAddressName(coords);
      set({
        userLocation: coords,
        departurePoint: coords,
        departureAddress: name,
        isMapLoading: false,
        error: null
      });
    };
    
    const handleGeoError = () => {
      set({
        userLocation: null,
        departurePoint: null,
        departureAddress: '',
        isMapLoading: false,
        error: "GPS tidak aktif atau izin ditolak. Silakan pilih lokasi keberangkatan secara manual di peta atau kolom input."
      });
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

  updateLocationFromMap: async (latlng, type) => {
    const coords: [number, number] = [latlng.lat, latlng.lng];
    const stateUpdate = type === 'departure'
      ? { departurePoint: coords, departureAddress: 'Memperbarui alamat...' }
      : { destinationPoint: coords, destinationAddress: 'Memperbarui alamat...' };

    set({ ...stateUpdate, routes: [] });
    get().clearError();

    const name = await fetchAddressName(coords);
    const finalUpdate = type === 'departure'
      ? { departureAddress: name }
      : { destinationAddress: name };
    set(finalUpdate);
  },

  fetchRoutes: async () => {
    const { departureAddress, destinationAddress, transportMode, includeTolls } = get();
    if (!departureAddress || !destinationAddress) {
      set({ error: "Lokasi keberangkatan dan tujuan harus diisi." });
      return;
    }
    set({ isRouteLoading: true, error: null, routes: [] });
    try {
      const startInfo = await resolveLocationToInfo(departureAddress);
      const endInfo = await resolveLocationToInfo(destinationAddress);

      if (!startInfo || !endInfo) {
        throw new Error("Satu atau kedua lokasi tidak dapat ditemukan.");
      }
      set({
        departurePoint: startInfo.coords,
        departureAddress: startInfo.name,
        destinationPoint: endInfo.coords,
        destinationAddress: endInfo.name,
      });
      const finalRoutes: RouteInfo[] = [];
      if (transportMode === 'car' && includeTolls) {
        const routesWithToll = await fetchOptimalRoutes(startInfo, endInfo, 'car', false);
        if (!routesWithToll || routesWithToll.length === 0) {
          throw new Error("Tidak dapat menemukan rute dari OpenRouteService.");
        }
        const primaryRoute = { ...routesWithToll[0], isPrimary: true };
        finalRoutes.push(primaryRoute);
        let alternativeRoute: RouteInfo | null = null;
        const routesWithoutToll = await fetchOptimalRoutes(startInfo, endInfo, 'car', true);
        const bestNoTollRoute = routesWithoutToll?.[0];
        const isDifferent = bestNoTollRoute && bestNoTollRoute.distance.toFixed(1) !== primaryRoute.distance.toFixed(1);
        if (isDifferent) {
            alternativeRoute = bestNoTollRoute;
        } else {
            if (routesWithToll.length > 1) {
                alternativeRoute = routesWithToll[1];
            }
        }
        if (alternativeRoute) {
            finalRoutes.push({ ...alternativeRoute, isPrimary: false, id: `${alternativeRoute.id}-alt` });
        }
      } else {
        const avoidToll = transportMode === 'motorbike' || (transportMode === 'car' && !includeTolls);
        const fetchedRoutes = await fetchOptimalRoutes(startInfo, endInfo, transportMode, avoidToll);
        if (fetchedRoutes.length > 0) {
          finalRoutes.push({ ...fetchedRoutes[0], isPrimary: true });
        }
        if (fetchedRoutes.length > 1) {
          finalRoutes.push({ ...fetchedRoutes[1], isPrimary: false });
        }
      }
      if (finalRoutes.length === 0) {
        throw new Error("Tidak ada rute yang dapat ditemukan antara dua lokasi ini.");
      }
      set({ routes: finalRoutes, isRouteLoading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan tak terduga.";
      set({ error: errorMessage, isRouteLoading: false, routes: [] });
    }
  },

  setActiveRoute: (routeId: string) => {
    const currentRoutes = get().routes;
    const newRoutes = currentRoutes.map(route => ({
      ...route,
      isPrimary: route.id === routeId,
    }));
    set({ routes: newRoutes });
  },
}));