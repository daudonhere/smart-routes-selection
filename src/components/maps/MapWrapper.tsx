'use client';
import dynamic from 'next/dynamic';
import { useRouteStore } from '@/stores/routesStore';
import { useEffect } from 'react';

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-full w-full background-secondary"><p className="text-text-primary">Memuat Peta...</p></div>,
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
      {error && (
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
        onMapClick={(latlng) => updateLocationFromMap(latlng, 'destination')}
        onRouteSelect={setActiveRoute}
      />
    </div>
  );
}