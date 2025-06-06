'use client';
import dynamic from 'next/dynamic';
import { useRouteStore } from '@/stores/routesStore';

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-full w-full bg-background-secondary"><p className="text-text-primary">Loading Map...</p></div>,
});

export default function MapWrapper() {
  const userLocation = useRouteStore((state) => state.userLocation);
  const destinationPoint = useRouteStore((state) => state.destinationPoint);
  const routes = useRouteStore((state) => state.routes);
  const setDestinationFromMapClick = useRouteStore((state) => state.setDestinationFromMapClick);
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
        destination={destinationPoint}
        routes={routes}
        onMapClick={setDestinationFromMapClick}
      />
    </div>
  );
}