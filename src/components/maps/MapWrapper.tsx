'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});

export default function MapWrapper() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported.');
      setIsLoading(false);
      return;
    }

    const successHandler = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      setUserLocation([latitude, longitude]);
      setIsLoading(false);
      setError(null);
    };

    const errorHandler = (geoError: GeolocationPositionError) => {
      setIsLoading(false);
      switch (geoError.code) {
        case geoError.PERMISSION_DENIED:
          setError('Location permission denied.');
          break;
        case geoError.POSITION_UNAVAILABLE:
          setError('Location not available.');
          break;
        case geoError.TIMEOUT:
          setError('Location request timed out.');
          break;
        default:
          setError('An unknown error occurred.');
          break;
      }
      console.error('Geolocation Error:', geoError);
    };

    const watchId = navigator.geolocation.watchPosition(successHandler, errorHandler, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <p className="text-lg font-semibold">Searching for your location...</p>
        <p className="text-sm text-gray-500">Please grant location permission.</p>
      </div>
    );
  }

  return (
    <div className="w-full full">
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white p-2 rounded-md z-20 animate-fade-in-down max-w-sm text-center">
          <p className="font-medium">Warning:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      <MapComponent userLocation={userLocation} />
    </div>
  );
}
