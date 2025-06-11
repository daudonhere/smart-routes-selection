'use client';

import dynamic from 'next/dynamic';
import { useRouteStore } from '@/stores/routesStore';
import { useEffect } from 'react';
import L from 'leaflet';

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-full w-full background-secondary"><p className="color-senary">Memuat Peta...</p></div>,
});

export default function MapWrapper() {
  const userLocation = useRouteStore((state) => state.userLocation);
  const departurePoint = useRouteStore((state) => state.departurePoint);
  const destinationPoint = useRouteStore((state) => state.destinationPoint);
  const routes = useRouteStore((state) => state.routes);
  const updateLocationFromMap = useRouteStore((state) => state.updateLocationFromMap);
  const setActiveRoute = useRouteStore((state) => state.setActiveRoute);
  const error = useRouteStore((state) => state.error);
  const clearError = useRouteStore((state) => state.clearError);
  const isOffering = useRouteStore((state) => state.isOffering);
  const nearbyDrivers = useRouteStore((state) => state.nearbyDrivers);
  const acceptingDriver = useRouteStore((state) => state.acceptingDriver);
  const pickupRoute = useRouteStore((state) => state.pickupRoute);
  const isDriverEnroute = useRouteStore((state) => state.isDriverEnroute);
  const driverPosition = useRouteStore((state) => state.driverPosition);
  const driverDirection = useRouteStore((state) => state.driverDirection);
  const hasDriverArrived = useRouteStore((state) => state.hasDriverArrived);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        if (!error.includes("GPS tidak aktif")) {
            clearError();
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  return (
    <div className="h-full w-full relative">
      {error && !isOffering && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white p-3 rounded-md z-[1001] shadow-lg max-w-md text-center text-sm">
          <p>{error}</p>
        </div>
      )}
      <MapComponent
        userLocation={userLocation}
        departurePoint={departurePoint}
        destinationPoint={destinationPoint}
        routes={routes}
        onMarkerDragEnd={updateLocationFromMap}
        onMapClick={(latlng: L.LatLng) => updateLocationFromMap(latlng, 'destination')}
        onRouteSelect={setActiveRoute}
        isOffering={isOffering}
        nearbyDrivers={nearbyDrivers}
        acceptingDriver={acceptingDriver}
        pickupRoute={pickupRoute}
        isDriverEnroute={isDriverEnroute}
        driverPosition={driverPosition}
        driverDirection={driverDirection}
        hasDriverArrived={hasDriverArrived}
      />
    </div>
  );
}