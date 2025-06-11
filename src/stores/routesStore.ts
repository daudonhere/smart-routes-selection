import { create } from 'zustand';
import L from 'leaflet';
import { fetchAddressName, resolveLocationToInfo } from '@/libs/geocoding';
import { fetchOptimalRoutes } from '@/libs/routing';
import { RouteInfo, TransportMode, ORSRoute, LocationInfo, Driver, DriverDirection } from '@/libs/types';
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

let animationFrameId: number | null = null;

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
    isOffering: boolean;
    nearbyDrivers: Driver[];
    acceptingDriver: Driver | null;
    pickupRoute: RouteInfo | null;
    isDriverEnroute: boolean;
    driverPosition: [number, number] | null;
    driverDirection: DriverDirection;
    hasDriverArrived: boolean;
    initializeLocation: () => void;
    setTransportMode: (mode: TransportMode) => void;
    setIncludeTolls: (include: boolean) => void;
    setDepartureFromInput: (address: string) => void;
    setDestinationFromInput: (address: string) => void;
    updateLocationFromMap: (latlng: L.LatLng, type: 'departure' | 'destination') => Promise<void>;
    fetchRoutes: () => Promise<void>;
    setActiveRoute: (routeId: string) => void;
    clearError: () => void;
    clearOffer: () => void;
    setPoint: (type: 'departure' | 'destination', locationInfo: LocationInfo) => void;
    startOfferSimulation: () => void;
    cancelOffer: () => void;
    _startDriverAnimation: () => void;
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
    isOffering: false,
    nearbyDrivers: [],
    acceptingDriver: null,
    pickupRoute: null,
    isDriverEnroute: false,
    driverPosition: null,
    driverDirection: 'front',
    hasDriverArrived: false,
    
    clearError: () => set({ error: null }),

    clearOffer: () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      set({ 
        isOffering: false, 
        nearbyDrivers: [], 
        acceptingDriver: null, 
        pickupRoute: null,
        isDriverEnroute: false,
        driverPosition: null,
        driverDirection: 'front',
        hasDriverArrived: false,
      });
    },
    
    cancelOffer: () => {
      get().clearOffer();
    },

    setTransportMode: (mode) => { get().clearOffer(); set({ transportMode: mode, routes: [] }); get().clearError(); },
    setIncludeTolls: (include) => { get().clearOffer(); set({ includeTolls: include, routes: [] }); get().clearError(); },
    setDepartureFromInput: (address) => { get().clearOffer(); set({ departureAddress: address, routes: [] }); },
    setDestinationFromInput: (address) => { get().clearOffer(); set({ destinationAddress: address, routes: [] }); },
    
    initializeLocation: () => {
        set({ isMapLoading: true });
        const init = async (coords: [number, number]) => {
            const name = await fetchAddressName(coords);
            set({ userLocation: coords, departurePoint: coords, departureAddress: name, isMapLoading: false, error: null });
        };
        const handleGeoError = () => set({ userLocation: null, departurePoint: null, departureAddress: '', isMapLoading: false, error: "GPS is not active or permission is denied. Please select the departure location manually on the map or input field" });
        if (!navigator.geolocation) { handleGeoError(); return; }
        navigator.geolocation.getCurrentPosition((position) => init([position.coords.latitude, position.coords.longitude]), handleGeoError, { timeout: 10000, enableHighAccuracy: true });
    },
    updateLocationFromMap: async (latlng, type) => {
        get().clearOffer();
        const coords: [number, number] = [latlng.lat, latlng.lng];
        const stateUpdate = type === 'departure' ? { departurePoint: coords, departureAddress: 'Update address...' } : { destinationPoint: coords, destinationAddress: 'Update address...' };
        set({ ...stateUpdate, routes: [] });
        get().clearError();
        const name = await fetchAddressName(coords);
        const finalUpdate = type === 'departure' ? { departureAddress: name } : { destinationAddress: name };
        set(finalUpdate);
    },
    setPoint: (type, locationInfo) => {
        get().clearOffer();
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
        get().clearOffer();
        const { departureAddress, destinationAddress, transportMode, includeTolls, userLocation } = get();
        if (!departureAddress || !destinationAddress) { set({ error: "Departure and destination locations must be filled in" }); return; }
        set({ isRouteLoading: true, error: null, routes: [] });

        try {
            const startInfo = await resolveLocationToInfo(departureAddress, userLocation);
            const endInfo = await resolveLocationToInfo(destinationAddress, userLocation);

            if (!startInfo || !endInfo) { throw new Error("Location could not be found"); }

            set({ departurePoint: startInfo.coords, departureAddress: startInfo.name, destinationPoint: endInfo.coords, destinationAddress: endInfo.name });

            const finalRoutes: RouteInfo[] = [];
            
            if ((transportMode === 'car' || transportMode === 'truck') && includeTolls) {
                const routesWithTollRaw = await fetchOptimalRoutes(startInfo, endInfo, transportMode, false);
                const routesWithoutTollRaw = await fetchOptimalRoutes(startInfo, endInfo, transportMode, true);
                const tollCandidateRaw = routesWithTollRaw?.[0];
                const nonTollCandidateRaw = routesWithoutTollRaw?.[0];
                if (!tollCandidateRaw && !nonTollCandidateRaw) { throw new Error("Unable to find route from ORS"); }
                let tollOption: RouteInfo | null = null;
                let nonTollOption: RouteInfo | null = null;
                if (tollCandidateRaw) {
                    const isTrulyTollRoute = nonTollCandidateRaw ? (tollCandidateRaw.summary.duration < nonTollCandidateRaw.summary.duration) : false; 
                    tollOption = { id: `route-toll-${Date.now()}`, ...processRawRouteToInfo(tollCandidateRaw, transportMode, isTrulyTollRoute), isPrimary: false };
                }
                if (nonTollCandidateRaw) {
                    nonTollOption = { id: `route-non-toll-${Date.now()}`, ...processRawRouteToInfo(nonTollCandidateRaw, transportMode, false), isPrimary: false };
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
                        finalRoutes.push({ ...routeData, id: `route-${index}-${Date.now()}`, isPrimary: index === 0 });
                    }
                });
            }

            if (finalRoutes.length === 0) { throw new Error("No route could be found between these two locations"); }

            set({ routes: finalRoutes, isRouteLoading: false });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
            set({ error: errorMessage, isRouteLoading: false, routes: [] });
        }
    },
    setActiveRoute: (routeId: string) => {
        const currentRoutes = get().routes;
        const newRoutes = currentRoutes.map(route => ({...route, isPrimary: route.id === routeId, }));
        set({ routes: newRoutes });
    },
    _startDriverAnimation: () => {
      const { pickupRoute } = get();
      if (!pickupRoute || pickupRoute.coordinates.length < 2) return;

      const durationInMs = pickupRoute.duration * 60 * 1000;
      const routeCoords = pickupRoute.coordinates;
      let startTime: number | null = null;
      let lastPosition = routeCoords[0];

      set({ isDriverEnroute: true, driverPosition: lastPosition });

      const animate = (timestamp: number) => {
        if (!startTime) {
          startTime = timestamp;
        }

        const elapsedTime = timestamp - startTime;
        let progress = elapsedTime / durationInMs;
        if (progress > 1) progress = 1;

        const targetIndexFloat = progress * (routeCoords.length - 1);
        const startIndex = Math.floor(targetIndexFloat);
        const endIndex = Math.min(startIndex + 1, routeCoords.length - 1);
        const segmentProgress = targetIndexFloat - startIndex;
        const startCoords = routeCoords[startIndex];
        const endCoords = routeCoords[endIndex];
        const interpolatedLat = startCoords[0] + (endCoords[0] - startCoords[0]) * segmentProgress;
        const interpolatedLng = startCoords[1] + (endCoords[1] - startCoords[1]) * segmentProgress;
        const newPosition: [number, number] = [interpolatedLat, interpolatedLng];

        if (newPosition[0] !== lastPosition[0] || newPosition[1] !== lastPosition[1]) {
          const dy = newPosition[0] - lastPosition[0];
          const dx = newPosition[1] - lastPosition[1];
          let newDirection: DriverDirection = get().driverDirection;
          if (Math.abs(dy) > Math.abs(dx)) {
            newDirection = dy < 0 ? 'front' : 'back';
          } else {
            newDirection = dx > 0 ? 'right' : 'left';
          }
          set({ driverDirection: newDirection });
        }
        
        set({ driverPosition: newPosition });
        lastPosition = newPosition;

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(animate);
        } else {
          set({ 
            isDriverEnroute: false, 
            hasDriverArrived: true,
            driverPosition: get().departurePoint,
          });
          animationFrameId = null;
        }
      };

      animationFrameId = requestAnimationFrame(animate);
    },
    startOfferSimulation: () => {
      const { departurePoint, transportMode } = get();
      if (!departurePoint) return;

      get().clearOffer();
      set({ isOffering: true });

      const generatedDrivers: Driver[] = [];
      const vehicleCount = 4; 
      for (let i = 0; i < vehicleCount; i++) {
        const randomDistance = (Math.sqrt(Math.random()) * 2000) + 500;
        const randomAngle = Math.random() * 2 * Math.PI;
        const latOffset = (randomDistance * Math.cos(randomAngle)) / 111111;
        const lonOffset = (randomDistance * Math.sin(randomAngle)) / (111111 * Math.cos(departurePoint[0] * Math.PI / 180));
        generatedDrivers.push({
            id: `driver-${i}-${Date.now()}`,
            type: transportMode,
            position: [departurePoint[0] + latOffset, departurePoint[1] + lonOffset]
        });
      }
      set({ nearbyDrivers: generatedDrivers });

      const delay = Math.random() * 5000 + 5000;
      setTimeout(async () => {
        const drivers = get().nearbyDrivers;
        const departure = get().departurePoint;
        if (drivers.length === 0 || !departure) {
            set({ isOffering: false });
            return;
        }

        const chosenDriver = drivers[Math.floor(Math.random() * drivers.length)];
        
        try {
          const driverLocationInfo: LocationInfo = { coords: chosenDriver.position, name: 'Driver Location' };
          const departureLocationInfo: LocationInfo = { coords: departure, name: 'Pickup Location' };
          const pickupRouteRaw = await fetchOptimalRoutes(driverLocationInfo, departureLocationInfo, chosenDriver.type, true);

          if (pickupRouteRaw.length > 0) {
            const routeData = processRawRouteToInfo(pickupRouteRaw[0], chosenDriver.type, false);
            const finalPickupRoute: RouteInfo = { ...routeData, id: `pickup-${chosenDriver.id}`, isPrimary: true };
            
            set({ acceptingDriver: chosenDriver, pickupRoute: finalPickupRoute, driverPosition: chosenDriver.position });

            setTimeout(() => {
              get()._startDriverAnimation();
            }, 5000);
          }
        } catch (e) {
          if (e instanceof Error) {
            console.error("Failed to calculate pickup route", e.message);
          } else {
            console.error("Failed to calculate pickup route", e);
          }
        }
        
        set({ isOffering: false });
      }, delay);
    }
}));