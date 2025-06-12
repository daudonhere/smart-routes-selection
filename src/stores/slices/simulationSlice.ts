import { StateCreator } from 'zustand';
import { AppState, SimulationSlice, Driver, LocationInfo, RouteInfo, DriverDirection } from '@/libs/types';
import { fetchOptimalRoutes } from '@/libs/routing';
import { processRawRouteToInfo } from '../helpers';

let animationFrameId: number | null = null;

export const createSimulationSlice: StateCreator<AppState, [], [], SimulationSlice> = (set, get) => ({
  isOffering: false,
  nearbyDrivers: [],
  acceptingDriver: null,
  pickupRoute: null,
  isDriverEnroute: false,
  driverPosition: null,
  driverDirection: 'front',
  hasDriverArrived: false,

  cancelOffer: () => {
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

  _startDriverAnimation: () => {
    const { pickupRoute } = get();
    if (!pickupRoute || pickupRoute.coordinates.length < 2) return;

    const durationInMs = pickupRoute.duration * 60 * 1000;
    const routeCoords = pickupRoute.coordinates;
    let startTime: number | null = null;
    let lastPosition = routeCoords[0];

    set({ isDriverEnroute: true, driverPosition: lastPosition });

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
        set({ isDriverEnroute: false, hasDriverArrived: true, driverPosition: get().departurePoint });
        animationFrameId = null;
      }
    };
    animationFrameId = requestAnimationFrame(animate);
  },

  startOfferSimulation: () => {
    const { departurePoint, transportMode } = get();
    if (!departurePoint) return;

    get().cancelOffer();
    set({ isOffering: true });

    const generatedDrivers: Driver[] = [];
    for (let i = 0; i < 7; i++) {
      const randomDistance = (Math.sqrt(Math.random()) * 2000) + 500;
      const randomAngle = Math.random() * 2 * Math.PI;
      const latOffset = (randomDistance * Math.cos(randomAngle)) / 111111;
      const lonOffset = (randomDistance * Math.sin(randomAngle)) / (111111 * Math.cos(departurePoint[0] * Math.PI / 180));
      generatedDrivers.push({ id: `driver-${i}-${Date.now()}`, type: transportMode, position: [departurePoint[0] + latOffset, departurePoint[1] + lonOffset] });
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
          setTimeout(() => get()._startDriverAnimation(), 5000);
        }
      } catch (e) {
        console.error("Failed to calculate pickup route", e);
      }
      set({ isOffering: false });
    }, delay);
  },
});