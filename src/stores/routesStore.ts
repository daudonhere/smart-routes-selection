import { create } from 'zustand';
import L from 'leaflet';
import { fetchAddressName, resolveLocationToInfo } from '@/libs/geocoding';
import { fetchOptimalRoutes } from '@/libs/routing';

export type TransportMode = 'motorbike' | 'car';

export interface RouteInfo {
  id: string;
  coordinates: [number, number][];
  distance: number;
  duration: number;
  isPrimary: boolean;
  hasToll: boolean;
}

interface RouteState {
    userLocation: [number, number] | null;
    departurePoint: [number, number] | null;
    destinationPoint: [number, number] | null;
    departureAddress: string;
    destinationAddress: string;
    transportMode: TransportMode;
    routes: RouteInfo[];
    isRouteLoading: boolean;
    isMapLoading: boolean;
    error: string | null;
    initializeLocation: () => void;
    setTransportMode: (mode: TransportMode) => void;
    setDepartureFromInput: (address: string) => void;
    setDestinationFromInput: (address: string) => void;
    updateLocationFromMap: (latlng: L.LatLng, type: 'departure' | 'destination') => Promise<void>;
    fetchRoutes: () => Promise<void>;
    setActiveRoute: (routeId: string) => void;
}

export const useRouteStore = create<RouteState>((set, get) => ({
    userLocation: null,
    departurePoint: null,
    destinationPoint: null,
    departureAddress: '',
    destinationAddress: '',
    transportMode: 'motorbike',
    routes: [],
    isRouteLoading: false,
    isMapLoading: true,
    error: null,

    setTransportMode: (mode) => {
        set({ transportMode: mode });
    },

    setDepartureFromInput: (address) => set({ departureAddress: address, routes: [] }),
    setDestinationFromInput: (address) => set({ destinationAddress: address, routes: [] }),

    initializeLocation: () => {
        set({ isMapLoading: true });
        const init = async (coords: [number, number], message: string | null = null) => {
            const name = await fetchAddressName(coords);
            set({
                userLocation: coords,
                departurePoint: coords,
                departureAddress: name,
                isMapLoading: false,
                error: message
            });
        };

        const fallbackToRandom = () => {
            const lat = -6.2 + (Math.random() * -2);
            const lng = 106.8 + (Math.random() * 8);
            init([lat, lng], 'GPS tidak aktif. Anda telah ditempatkan di lokasi acak di Indonesia.');
        };

        if (!navigator.geolocation) {
            fallbackToRandom();
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => init([position.coords.latitude, position.coords.longitude]),
            () => fallbackToRandom()
        );
    },

    updateLocationFromMap: async (latlng, type) => {
        const coords: [number, number] = [latlng.lat, latlng.lng];
        const stateUpdate = type === 'departure'
            ? { departurePoint: coords, departureAddress: 'Memperbarui alamat...' }
            : { destinationPoint: coords, destinationAddress: 'Memperbarui alamat...' };

        set({ ...stateUpdate, routes: [] });

        const name = await fetchAddressName(coords);

        const finalUpdate = type === 'departure'
            ? { departureAddress: name }
            : { destinationAddress: name };
        set(finalUpdate);
    },

    fetchRoutes: async () => {
        const { departureAddress, destinationAddress, transportMode } = get();
        if (!departureAddress || !destinationAddress) {
            set({ error: "Lokasi keberangkatan dan tujuan harus diisi." });
            return;
        }

        set({ isRouteLoading: true, error: null });

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

            const newRoutes = await fetchOptimalRoutes(startInfo, endInfo, transportMode);
            set({ routes: newRoutes, isRouteLoading: false });
        } catch (error: unknown) {
            let errorMessage = "Terjadi kesalahan tak terduga saat mengambil rute.";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            set({ error: errorMessage, isRouteLoading: false, routes: [] });
        }
    },

    setActiveRoute: (routeId: string) => {
        const currentRoutes = get().routes;
        const newRoutes = currentRoutes.map(route => ({
            ...route,
            isPrimary: route.id === routeId
        }));
        set({ routes: newRoutes });
    },
}));