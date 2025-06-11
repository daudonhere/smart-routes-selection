import { create } from 'zustand';
import L from 'leaflet';
import { fetchAddressName, resolveLocationToInfo } from '@/libs/geocoding';
import { fetchOptimalRoutes } from '@/libs/routing';
import { RouteInfo, TransportMode, ORSRoute, LocationInfo } from '@/libs/types';
import polyline from '@mapbox/polyline';

const MOTORBIKE_SPEED_ADJUSTMENT = 17;
const CAR_TOLL_SPEED_ADJUSTMENT = 15;
const CAR_NON_TOLL_SPEED_ADJUSTMENT = -30;
const TRUCK_TOLL_SPEED_ADJUSTMENT = 10;
const TRUCK_NON_TOLL_SPEED_ADJUSTMENT = -15;

const processRawRouteToInfo = (
  rawRoute: ORSRoute,
  transportMode: TransportMode,
  hasToll: boolean
): Omit<RouteInfo, 'id' | 'isPrimary'> => {
  const { summary, geometry } = rawRoute;
  const distanceKm = summary.distance / 1000;
  const decodedCoordinates = polyline.decode(geometry) as [number, number][];
  const orsDurationMinutes = summary.duration / 60;

  const orsAverageSpeed = distanceKm > 0 ? distanceKm / (orsDurationMinutes / 60) : 0;

  let adjustedAverageSpeed = orsAverageSpeed;

  switch (transportMode) {
    case 'motorbike':
      adjustedAverageSpeed += MOTORBIKE_SPEED_ADJUSTMENT;
      break;
    case 'car':
      adjustedAverageSpeed += hasToll ? CAR_TOLL_SPEED_ADJUSTMENT : CAR_NON_TOLL_SPEED_ADJUSTMENT;
      break;
    case 'truck':
      adjustedAverageSpeed += hasToll ? TRUCK_TOLL_SPEED_ADJUSTMENT : TRUCK_NON_TOLL_SPEED_ADJUSTMENT;
      break;
  }

  if (adjustedAverageSpeed < 5) {
    adjustedAverageSpeed = 5;
  }

  const finalDurationMinutes = (distanceKm / adjustedAverageSpeed) * 60;

  return {
    coordinates: decodedCoordinates,
    distance: distanceKm,
    duration: finalDurationMinutes,
    hasToll,
    averageSpeed: adjustedAverageSpeed,
  };
};

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
    setPoint: (type: 'departure' | 'destination', locationInfo: LocationInfo) => void;
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
    setTransportMode: (mode) => { set({ transportMode: mode, routes: [] }); get().clearError(); },
    setIncludeTolls: (include) => { set({ includeTolls: include, routes: [] }); get().clearError(); },
    setDepartureFromInput: (address) => set({ departureAddress: address, routes: [] }),
    setDestinationFromInput: (address) => set({ destinationAddress: address, routes: [] }),
    initializeLocation: () => {
        set({ isMapLoading: true });
        const init = async (coords: [number, number]) => {
            const name = await fetchAddressName(coords);
            set({ userLocation: coords, departurePoint: coords, departureAddress: name, isMapLoading: false, error: null });
        };
        const handleGeoError = () => set({ userLocation: null, departurePoint: null, departureAddress: '', isMapLoading: false, error: "GPS tidak aktif atau izin ditolak. Silakan pilih lokasi keberangkatan secara manual di peta atau kolom input." });
        if (!navigator.geolocation) { handleGeoError(); return; }
        navigator.geolocation.getCurrentPosition((position) => init([position.coords.latitude, position.coords.longitude]), handleGeoError, { timeout: 10000, enableHighAccuracy: true });
    },
    updateLocationFromMap: async (latlng, type) => {
        const coords: [number, number] = [latlng.lat, latlng.lng];
        const stateUpdate = type === 'departure' ? { departurePoint: coords, departureAddress: 'Memperbarui alamat...' } : { destinationPoint: coords, destinationAddress: 'Memperbarui alamat...' };
        set({ ...stateUpdate, routes: [] });
        get().clearError();
        const name = await fetchAddressName(coords);
        const finalUpdate = type === 'departure' ? { departureAddress: name } : { destinationAddress: name };
        set(finalUpdate);
    },
    setPoint: (type, locationInfo) => {
        if (type === 'departure') {
            set({
                departureAddress: locationInfo.name,
                departurePoint: locationInfo.coords,
                routes: []
            });
        } else {
            set({
                destinationAddress: locationInfo.name,
                destinationPoint: locationInfo.coords,
                routes: []
            });
        }
    },
    fetchRoutes: async () => {
        const { departureAddress, destinationAddress, transportMode, includeTolls, userLocation } = get();
        if (!departureAddress || !destinationAddress) { set({ error: "Lokasi keberangkatan dan tujuan harus diisi." }); return; }

        set({ isRouteLoading: true, error: null, routes: [] });

        try {
            const startInfo = await resolveLocationToInfo(departureAddress, userLocation);
            const endInfo = await resolveLocationToInfo(destinationAddress, userLocation);

            if (!startInfo || !endInfo) { throw new Error("Satu atau kedua lokasi tidak dapat ditemukan."); }

            set({ departurePoint: startInfo.coords, departureAddress: startInfo.name, destinationPoint: endInfo.coords, destinationAddress: endInfo.name });

            const finalRoutes: RouteInfo[] = [];
            
            if ((transportMode === 'car' || transportMode === 'truck') && includeTolls) {
                const routesWithTollRaw = await fetchOptimalRoutes(startInfo, endInfo, transportMode, false);
                const routesWithoutTollRaw = await fetchOptimalRoutes(startInfo, endInfo, transportMode, true);

                const tollCandidateRaw = routesWithTollRaw?.[0];
                const nonTollCandidateRaw = routesWithoutTollRaw?.[0];

                if (!tollCandidateRaw && !nonTollCandidateRaw) {
                    throw new Error("Tidak dapat menemukan rute dari OpenRouteService.");
                }

                let tollOption: RouteInfo | null = null;
                let nonTollOption: RouteInfo | null = null;

                if (tollCandidateRaw) {
                    const isTrulyTollRoute = nonTollCandidateRaw 
                        ? (tollCandidateRaw.summary.duration < nonTollCandidateRaw.summary.duration) 
                        : false; 

                    tollOption = {
                        id: `route-toll-${Date.now()}`,
                        ...processRawRouteToInfo(tollCandidateRaw, transportMode, isTrulyTollRoute),
                        isPrimary: false,
                    };
                }

                if (nonTollCandidateRaw) {
                    nonTollOption = {
                        id: `route-non-toll-${Date.now()}`,
                        ...processRawRouteToInfo(nonTollCandidateRaw, transportMode, false),
                        isPrimary: false,
                    };
                }
                
                if (tollOption && nonTollOption) {
                    if (tollOption.duration <= nonTollOption.duration) {
                        tollOption.isPrimary = true;
                        finalRoutes.push(tollOption, nonTollOption);
                    } else {
                        nonTollOption.isPrimary = true;
                        finalRoutes.push(nonTollOption, tollOption);
                    }
                } else if (tollOption) {
                    tollOption.isPrimary = true;
                    finalRoutes.push(tollOption);
                } else if (nonTollOption) {
                    nonTollOption.isPrimary = true;
                    finalRoutes.push(nonTollOption);
                }

            } else {
                const avoidToll = transportMode === 'motorbike' || !includeTolls;
                const fetchedRoutesRaw = await fetchOptimalRoutes(startInfo, endInfo, transportMode, avoidToll);

                fetchedRoutesRaw.forEach((rawRoute, index) => {
                    if (index < 2) {
                        const hasToll = false;
                        const routeData = processRawRouteToInfo(rawRoute, transportMode, hasToll);
                        finalRoutes.push({
                            ...routeData,
                            id: `route-${index}-${Date.now()}`,
                            isPrimary: index === 0,
                        });
                    }
                });
            }

            if (finalRoutes.length === 0) { throw new Error("Tidak ada rute yang dapat ditemukan antara dua lokasi ini."); }

            set({ routes: finalRoutes, isRouteLoading: false });

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan tak terduga.";
            set({ error: errorMessage, isRouteLoading: false, routes: [] });
        }
    },
    setActiveRoute: (routeId: string) => {
        const currentRoutes = get().routes;
        const newRoutes = currentRoutes.map(route => ({...route, isPrimary: route.id === routeId, }));
        set({ routes: newRoutes });
    },
}));