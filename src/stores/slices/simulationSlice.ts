import { StateCreator } from 'zustand';
import { AppState, SimulationSlice, Driver, LocationInfo, RouteInfo, DriverDirection } from '@/libs/types';
import { fetchOptimalRoutes } from '@/libs/routing';
import { processRawRouteToInfo } from '../helpers';

let animationFrameId: number | null = null;

const clearAnimation = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
};

export const createSimulationSlice: StateCreator<AppState, [], [], SimulationSlice> = (set, get) => ({
  isActionLocked: false,
  isOffering: false,
  nearbyDrivers: [],
  acceptingDriver: null,
  pickupRoute: null,
  isDriverEnroute: false,
  isJourneyInProgress: false,
  driverPosition: null,
  driverDirection: 'front',
  hasDriverArrived: false,
  journeyMessage: null,

  cancelOffer: () => {
    clearAnimation();
    set({
      isActionLocked: false,
      isOffering: false,
      nearbyDrivers: [],
      acceptingDriver: null,
      pickupRoute: null,
      isDriverEnroute: false,
      isJourneyInProgress: false,
      driverPosition: null,
      driverDirection: 'front',
      hasDriverArrived: false,
      journeyMessage: null,
    });
  },

  resetApplication: () => {
    get().cancelOffer();
    const userLocation = get().userLocation;
    const initialAddress = get().departureAddress;
    set({
        routes: [],
        destinationPoint: null,
        destinationAddress: '',
        departurePoint: userLocation,
        departureAddress: userLocation ? initialAddress : '',
        error: null,
    });
  },

  _startMainJourneyAnimation: () => {
    const primaryRoute = get().routes.find(r => r.isPrimary);
    const destination = get().destinationPoint;
    if (!primaryRoute || primaryRoute.coordinates.length < 2 || !destination) {
      console.error("Main journey start failed, no primary route or destination.");
      get().resetApplication();
      return;
    }

    set({ journeyMessage: "Okay lets start this journey", isJourneyInProgress: true });
    
    const durationInMs = primaryRoute.duration * 60 * 1000;
    const routeCoords = primaryRoute.coordinates;
    let startTime: number | null = null;
    let lastPosition = routeCoords[0];

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
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
        if (Math.abs(dy) > Math.abs(dx)) newDirection = dy < 0 ? 'front' : 'back';
        else newDirection = dx > 0 ? 'right' : 'left';
        set({ driverDirection: newDirection });
      }

      set({ driverPosition: newPosition });
      lastPosition = newPosition;

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        clearAnimation();
        set({
          isJourneyInProgress: false,
          hasDriverArrived: false,
          driverPosition: destination,
          journeyMessage: "Im finish, thank you",
        });
        setTimeout(() => get().resetApplication(), 5000);
      }
    };
    animationFrameId = requestAnimationFrame(animate);
  },

  _startPickupAnimation: () => {
    const { pickupRoute, departurePoint } = get();
    if (!pickupRoute || pickupRoute.coordinates.length < 2 || !departurePoint) {
      console.error("Pickup animation start failed, no pickup route or departure point.");
      get().cancelOffer();
      return;
    }

    const durationInMs = pickupRoute.duration * 60 * 1000;
    const routeCoords = pickupRoute.coordinates;
    let startTime: number | null = null;
    let lastPosition = routeCoords[0];

    set({ isDriverEnroute: true, isActionLocked: true, driverPosition: lastPosition });

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
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
        if (Math.abs(dy) > Math.abs(dx)) newDirection = dy < 0 ? 'front' : 'back';
        else newDirection = dx > 0 ? 'right' : 'left';
        set({ driverDirection: newDirection });
      }

      set({ driverPosition: newPosition });
      lastPosition = newPosition;

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        clearAnimation();
        set({
          isDriverEnroute: false,
          hasDriverArrived: true,
          driverPosition: departurePoint,
          journeyMessage: "Knock, Knock! Im Here",
        });
        setTimeout(() => get()._startMainJourneyAnimation(), 5000);
      }
    };
    animationFrameId = requestAnimationFrame(animate);
  },

  startOfferSimulation: () => {
    const { departurePoint, transportMode } = get();
    if (!departurePoint) return;

    get().cancelOffer();
    set({ isOffering: true });

    const generatedDrivers: Driver[] = Array.from({ length: 4 }, (_, i) => {
        const randomDistance = (Math.sqrt(Math.random()) * 1000) + 500;
        const randomAngle = Math.random() * 2 * Math.PI;
        const latOffset = (randomDistance * Math.cos(randomAngle)) / 111111;
        const lonOffset = (randomDistance * Math.sin(randomAngle)) / (111111 * Math.cos(departurePoint[0] * Math.PI / 180));
        return { id: `driver-${i}-${Date.now()}`, type: transportMode, position: [departurePoint[0] + latOffset, departurePoint[1] + lonOffset] };
    });
    set({ nearbyDrivers: generatedDrivers });

    const delay = Math.random() * 5000 + 3000;
    setTimeout(async () => {
      if (!get().isOffering) return;
      
      const drivers = get().nearbyDrivers;
      const departure = get().departurePoint;
      if (drivers.length === 0 || !departure) {
          set({ isOffering: false });
          return;
      }
      const chosenDriver = drivers[Math.floor(Math.random() * drivers.length)];
      set({ isOffering: false });

      try {
        const driverLocationInfo: LocationInfo = { coords: chosenDriver.position, name: 'Driver Location' };
        const departureLocationInfo: LocationInfo = { coords: departure, name: 'Pickup Location' };
        const pickupRouteRaw = await fetchOptimalRoutes(driverLocationInfo, departureLocationInfo, chosenDriver.type, true);
        
        if (pickupRouteRaw.length > 0) {
          const routeData = processRawRouteToInfo(pickupRouteRaw[0], chosenDriver.type, false);
          const finalPickupRoute: RouteInfo = { ...routeData, id: `pickup-${chosenDriver.id}`, isPrimary: true };
          
          set({ acceptingDriver: chosenDriver, pickupRoute: finalPickupRoute, driverPosition: chosenDriver.position, journeyMessage: null });
          
          setTimeout(() => {
            if (get().acceptingDriver?.id !== chosenDriver.id) {
                return; 
            }
            get()._startPickupAnimation();
          }, 5000);

        } else {
          get().cancelOffer();
        }
      } catch (e) {
        console.error("Failed to calculate pickup route", e);
        get().cancelOffer();
      }
    }, delay);
  },
});