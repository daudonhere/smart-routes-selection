// src/components/map/MapWrapper.tsx
'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <p>Memuat peta...</p>,
});

export default function MapWrapper() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation tidak didukung oleh browser Anda.');
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
          setError('Location declined');
          break;
        case geoError.POSITION_UNAVAILABLE:
          setError('Location not provide');
          break;
        case geoError.TIMEOUT:
          setError('Timeout');
          break;
        default:
          setError('Something error');
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
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-lg font-semibold">Search your location...</p>
        <p className="text-sm text-gray-500">Please add location permission.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white p-2 rounded-md shadow-lg z-20 animate-fade-in-down max-w-sm text-center">
          <p className="font-medium">Perhatian:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      <MapComponent userLocation={userLocation} />
    </div>
  );
}