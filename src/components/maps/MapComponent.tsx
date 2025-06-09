// src/components/maps/MapComponent.tsx

'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useMemo } from 'react';
import { RouteInfo } from '@/libs/types';
import MapController from './MapController';
import MapEventsHandler from './MapEventsHandler';
import RadarEffect from '../radar/RadarEffect';

const startMarkerIcon = new L.Icon({
  iconUrl: '/maps/point.png',
  iconRetinaUrl: '/maps/point.png',
  iconSize: [60, 60],
  iconAnchor: [30, 60],
  popupAnchor: [0, -60],
});

const endMarkerIcon = new L.Icon({
  iconUrl: '/maps/marker.png',
  iconRetinaUrl: '/maps/marker.png',
  iconSize: [43, 50],
  iconAnchor: [17, 61],
  popupAnchor: [1, -34],
});

const DEFAULT_LOCATIONS: [number, number][] = [
    [-6.2088, 106.8456],
    [1.3521, 103.8198],
    [40.7128, -74.0060],
    [35.6762, 139.6503],
    [39.9042, 116.4074], 
    [28.6139, 77.2090],
];

interface MapProps {
  userLocation: [number, number] | null;
  departurePoint: [number, number] | null;
  destinationPoint: [number, number] | null;
  onMapClick: (latlng: L.LatLng) => void;
  onMarkerDragEnd: (latlng: L.LatLng, type: 'departure' | 'destination') => void;
  onRouteSelect: (routeId: string) => void;
  routes: RouteInfo[];
}

export default function MapComponent({
  userLocation,
  departurePoint,
  destinationPoint,
  onMapClick,
  onMarkerDragEnd,
  onRouteSelect,
  routes,
}: MapProps) {

  const defaultLocation = useMemo(() => {
    return DEFAULT_LOCATIONS[Math.floor(Math.random() * DEFAULT_LOCATIONS.length)];
  }, []);

  const mapCenter = userLocation || defaultLocation; 
  const initialZoom = userLocation ? 13 : 10; 

  const sortedRoutes = useMemo(
    () => [...routes].sort((a, b) => Number(a.isPrimary) - Number(b.isPrimary)),
    [routes]
  );

  return (
    <MapContainer center={mapCenter} zoom={initialZoom} scrollWheelZoom={true} className="h-full w-full">
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
      />
      
      <MapController routes={routes} />
      <MapEventsHandler onMapClick={onMapClick} destinationPoint={destinationPoint} />
      {departurePoint && <RadarEffect center={departurePoint} />}

      {departurePoint && (
        <Marker
          position={departurePoint}
          icon={startMarkerIcon}
          draggable={true}
          eventHandlers={{
            dragend: (e) => onMarkerDragEnd(e.target.getLatLng(), 'departure'),
          }}
          zIndexOffset={100}
        >
          <Popup>Lokasi Keberangkatan</Popup>
        </Marker>
      )}

      {destinationPoint && (
        <Marker
          position={destinationPoint}
          icon={endMarkerIcon}
          draggable={true}
          eventHandlers={{
            dragend: (e) => onMarkerDragEnd(e.target.getLatLng(), 'destination'),
          }}
        >
          <Popup>Tujuan</Popup>
        </Marker>
      )}

      {sortedRoutes.map((route) => (
        <Polyline
          key={route.id}
          positions={route.coordinates}
          pathOptions={{
            color: route.isPrimary ? '#FFBF00' : '#4B5563',
            weight: route.isPrimary ? 5 : 8,
            opacity: route.isPrimary ? 0.9 : 0.8,
          }}
          eventHandlers={{
            click: () => {
              if (!route.isPrimary) {
                onRouteSelect(route.id);
              }
            },
          }}
        />
      ))}
    </MapContainer>
  );
}