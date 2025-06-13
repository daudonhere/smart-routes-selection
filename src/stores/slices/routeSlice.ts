import { StateCreator } from 'zustand';
import { AppState, RouteSlice, RouteInfo } from '@/libs/types';
import { fetchOptimalRoutes } from '@/libs/routing';
import { resolveLocationToInfo } from '@/libs/geocoding';
import { processRawRouteToInfo } from '@/libs/helpers';

export const createRouteSlice: StateCreator<AppState, [], [], RouteSlice> = (set, get) => ({
  departurePoint: null,
  destinationPoint: null,
  departureAddress: '',
  destinationAddress: '',
  transportMode: 'motorbike',
  routes: [],
  includeTolls: true,
  
  setTransportMode: (mode) => { get().cancelOffer(); set({ transportMode: mode, routes: [] }); get().clearError(); },
  setIncludeTolls: (include) => { get().cancelOffer(); set({ includeTolls: include, routes: [] }); get().clearError(); },
  setDepartureFromInput: (address) => { get().cancelOffer(); set({ departureAddress: address, routes: [] }); },
  setDestinationFromInput: (address) => { get().cancelOffer(); set({ destinationAddress: address, routes: [] }); },
  
  setPoint: (type, locationInfo) => {
    get().cancelOffer();
    if (type === 'departure') {
        set({ departureAddress: locationInfo.name, departurePoint: locationInfo.coords, routes: [] });
    } else {
        set({ destinationAddress: locationInfo.name, destinationPoint: locationInfo.coords, routes: [] });
    }
  },

  setActiveRoute: (routeId: string) => {
    set((state) => ({
      routes: state.routes.map(route => ({...route, isPrimary: route.id === routeId }))
    }));
  },

  fetchRoutes: async () => {
    get().cancelOffer();
    const { departureAddress, destinationAddress, transportMode, includeTolls, userLocation } = get();
    if (!departureAddress || !destinationAddress) {
      set({ error: "Departure and destination must be filled." });
      return;
    }

    set({ isRouteLoading: true, error: null, routes: [] });

    try {
        const startInfo = await resolveLocationToInfo(departureAddress, userLocation);
        const endInfo = await resolveLocationToInfo(destinationAddress, userLocation);
        if (!startInfo || !endInfo) throw new Error("One or both locations could not be found.");
        set({ departurePoint: startInfo.coords, departureAddress: startInfo.name, destinationPoint: endInfo.coords, destinationAddress: endInfo.name });

        const finalRoutes: RouteInfo[] = [];
        if ((transportMode === 'car' || transportMode === 'truck') && includeTolls) {
            const routesWithTollRaw = await fetchOptimalRoutes(startInfo, endInfo, transportMode, false);
            const routesWithoutTollRaw = await fetchOptimalRoutes(startInfo, endInfo, transportMode, true);
            const tollCandidateRaw = routesWithTollRaw?.[0];
            const nonTollCandidateRaw = routesWithoutTollRaw?.[0];
            if (!tollCandidateRaw && !nonTollCandidateRaw) throw new Error("Could not find a route from the routing service.");
            
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
                if (Math.abs(tollOption.distance - nonTollOption.distance) < 0.01) {
                    tollOption.isPrimary = true;
                    finalRoutes.push(tollOption);
                } else {
                    if (tollOption.duration <= nonTollOption.duration) {
                        tollOption.isPrimary = true;
                        finalRoutes.push(tollOption, nonTollOption);
                    } else {
                        nonTollOption.isPrimary = true;
                        finalRoutes.push(nonTollOption, tollOption);
                    }
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
        if (finalRoutes.length === 0) throw new Error("No route could be found between these locations.");
        set({ routes: finalRoutes, isRouteLoading: false });
    } catch (error: unknown) {
        let finalErrorMessage = "An unexpected error occurred while fetching routes.";

        if (error instanceof Error) {
            if (error.message.includes("distance must not be greater than")) {
                finalErrorMessage = "Route distance exceeds the limit, maximum route limit is 150km";
            } 
            else if (error.message.includes("Could not find routable point")) {
                finalErrorMessage = "A selected location is unreachable. Please choose a point closer to a road.";
            }
            else {
                finalErrorMessage = error.message;
            }
        }
        
        set({ error: finalErrorMessage, isRouteLoading: false, routes: [] });
    }
  },
});