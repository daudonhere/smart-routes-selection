'use client';
import dynamic from 'next/dynamic';
import { useRouteStore } from '@/stores/routesStore';

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-full w-full bg-background-secondary"><p className="text-text-primary">Memuat Peta...</p></div>,
});

export default function MapWrapper() {
  const userLocation = useRouteStore((state) => state.userLocation);
  const departurePoint = useRouteStore((state) => state.departurePoint);
  const destinationPoint = useRouteStore((state) => state.destinationPoint);
  const routes = useRouteStore((state) => state.routes);
  const transportMode = useRouteStore((state) => state.transportMode);
  const updateLocationFromMap = useRouteStore((state) => state.updateLocationFromMap);
  const setActiveRoute = useRouteStore((state) => state.setActiveRoute);
  const error = useRouteStore((state) => state.error);

  return (
    <div className="h-full w-full relative">
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white p-3 rounded-md z-[1001] shadow-lg max-w-md text-center text-sm">
          <p>⚠️ {error}</p>
        </div>
      )}
      <MapComponent
        userLocation={userLocation}
        departurePoint={departurePoint}
        destinationPoint={destinationPoint}
        routes={routes}
        transportMode={transportMode}
        onMarkerDragEnd={updateLocationFromMap}
        onMapClick={(latlng) => updateLocationFromMap(latlng, 'destination')}
        onRouteSelect={setActiveRoute}
      />
    </div>
  );
}