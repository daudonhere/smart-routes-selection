import { create } from 'zustand';
import L from 'leaflet';

const OPENROUTESERVICE_API_KEY = process.env.NEXT_PUBLIC_ORS_API_KEY;
const SUKABUMI_COORDS: [number, number] = [-6.9217, 106.9095];

export type TransportMode = 'motorbike' | 'car';

export interface RouteInfo {
  id: string;
  coordinates: [number, number][];
  distance: number;
  duration: number;
  isPrimary: boolean;
  hasToll: boolean;
}

interface LocationInfo {
  coords: [number, number];
  name: string;
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
    setDestinationFromMapClick: (latlng: L.LatLng) => Promise<void>;
    clearDestination: () => void;
    clearRoutes: () => void;
    fetchRoutes: (departure: string, destination: string) => Promise<void>;
}

const fetchAddressName = async (coords: [number, number]): Promise<string> => {
    if (!OPENROUTESERVICE_API_KEY.startsWith('5b3ce359')) {
        return `${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}`;
      }
      try {
        const response = await fetch(`https://api.openrouteservice.org/geocode/reverse?api_key=${OPENROUTESERVICE_API_KEY}&point.lon=${coords[1]}&point.lat=${coords[0]}&size=1`);
        if (!response.ok) return `${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}`;
        const data = await response.json();
        return data.features?.[0]?.properties?.label || `${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}`;
      } catch (error) {
        console.error("Reverse geocoding error:", error);
        return `${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}`;
      }
};

const resolveLocationToInfo = async (locationInput: string | [number, number]): Promise<LocationInfo | null> => {
    if (Array.isArray(locationInput)) {
        const name = await fetchAddressName(locationInput);
        return { coords: locationInput, name };
    }
    try {
        const response = await fetch(`https://api.openrouteservice.org/geocode/search?api_key=${OPENROUTESERVICE_API_KEY}&text=${encodeURIComponent(locationInput)}&boundary.country=ID&size=1`);
        if (!response.ok) throw new Error('Geocoding search failed.');
        const data = await response.json();
        if (data.features?.length > 0) {
            const feature = data.features[0];
            const [lon, lat] = feature.geometry.coordinates;
            return { coords: [lat, lon], name: feature.properties.label };
        }
        return null;
    } catch (error) {
        console.error("Geocoding error:", error);
        return null;
    }
};


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
  setTransportMode: (mode) => set({ transportMode: mode, routes: [] }),
  clearDestination: () => set({ destinationPoint: null, destinationAddress: '', routes: [] }),
  clearRoutes: () => set({ routes: [] }),
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
    if (!navigator.geolocation) {
        init(SUKABUMI_COORDS, 'Geolocation not supported. Using default location.');
        return;
    }
    navigator.geolocation.getCurrentPosition(
        (position) => init([position.coords.latitude, position.coords.longitude]),
        (err) => init(SUKABUMI_COORDS, `Geolocation Error: ${err.message}. Using default location.`)
    );
  },
  setDestinationFromMapClick: async (latlng) => {
    const coords: [number, number] = [latlng.lat, latlng.lng];
    set({ destinationAddress: "Fetching address...", destinationPoint: coords, routes: [] });
    const name = await fetchAddressName(coords);
    set({ destinationAddress: name });
  },
  fetchRoutes: async (departure, destination) => {
    if (!departure || !destination) {
      set({ error: "Departure and destination are required." });
      return;
    }
    set({ isRouteLoading: true, error: null, routes: [] });
    try {
        const startInfo = await resolveLocationToInfo(departure);
        const endInfo = await resolveLocationToInfo(destination);
        if (!startInfo || !endInfo) {
            throw new Error("Could not find one or both locations.");
        }
        set({
            departurePoint: startInfo.coords,
            departureAddress: startInfo.name,
            destinationPoint: endInfo.coords,
            destinationAddress: endInfo.name
        });

        const { transportMode } = get();
        const profile = transportMode === 'car' ? 'driving-car' : 'driving-car';
        
        const requestBody: any = {
            coordinates: [
                [startInfo.coords[1], startInfo.coords[0]],
                [endInfo.coords[1], endInfo.coords[0]],
            ],
            alternative_routes: {
                target_count: 3,
                share_factor: 0.6,
                weight_factor: 1.4,
            },
            instructions: true,
        };
        if (transportMode === 'motorbike') {
            requestBody.options = {
                avoid_features: ["tollways"]
            };
        }
        const res = await fetch(`https://api.openrouteservice.org/v2/directions/${profile}/geojson`, {
            method: 'POST',
            headers: {
                'Authorization': OPENROUTESERVICE_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!res.ok) {
            const errData = await res.json();
            const errorMessage = errData.error?.message || 'Failed to fetch routes.';
            if(errData.error?.details) {
                console.error("Error ", errData.error.details);
            }
            throw new Error(errorMessage);
        }

        const data = await res.json();
        if (!data.features || data.features.length === 0) {
            throw new Error("No routes found.");
        }
        
        const newRoutes: RouteInfo[] = data.features.map((feature: any, index: number) => {
            const summary = feature.properties.summary;
            const distanceKm = summary.distance / 1000;
            let hasToll = false;

            if (transportMode === 'car') {
                const segments = feature.properties.segments;
                hasToll = segments?.some((seg: any) => seg.steps?.some((step: any) => step.toll)) ?? false;
            }

            const durationMinutes = summary.duration / 60;

            return {
                id: `route-${index}`,
                coordinates: feature.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]),
                distance: distanceKm,
                duration: durationMinutes,
                isPrimary: index === 0,
                hasToll: hasToll,
            };
        });

        set({ routes: newRoutes, isRouteLoading: false });

    } catch (err: any) {
        set({ error: err.message, isRouteLoading: false });
    }
  },
}));