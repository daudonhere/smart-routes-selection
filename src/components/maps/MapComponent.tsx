'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-compass/dist/leaflet-compass.min.css';
import L from 'leaflet';
import { useEffect, useRef, useMemo } from 'react';
import { RouteInfo } from '@/libs/types';
import 'leaflet-compass';

const startMarkerIcon = new L.Icon({
  iconUrl: '/maps/marker.png',
  iconRetinaUrl: '/maps/marker.png',
  iconSize: [35, 61],
  iconAnchor: [17, 61],
  popupAnchor: [1, -34],
});

const endMarkerIcon = new L.Icon({
  iconUrl: '/maps/marker.png',
  iconRetinaUrl: '/maps/marker.png',
  iconSize: [35, 61],
  iconAnchor: [17, 61],
  popupAnchor: [1, -34],
});

interface MapProps {
  userLocation: [number, number] | null;
  departurePoint: [number, number] | null;
  destinationPoint: [number, number] | null;
  onMapClick: (latlng: L.LatLng) => void;
  onMarkerDragEnd: (latlng: L.LatLng, type: 'departure' | 'destination') => void;
  onRouteSelect: (routeId: string) => void;
  routes: RouteInfo[];
}

interface MapWithCompass extends L.Map {
  _compass?: L.Control.Compass;
}

function MapController({ routes }: { routes: RouteInfo[] }) {
  const map = useMap() as MapWithCompass;
  const prevBoundsRef = useRef<string | null>(null);

  useEffect(() => {
    if (!map._compass) {
        const compassControl = L.control.compass({
            autoActive: true,
            showDigit: false,
            position: 'topright',
          });
        map._compass = compassControl;
        map.addControl(compassControl);
    }
  }, [map]);

  useEffect(() => {
    if (routes && routes.length > 0) {
      const allCoords = routes.flatMap((r) => r.coordinates);
      if (allCoords.length > 0) {
        const bounds = L.latLngBounds(allCoords as L.LatLngExpression[]);
        const boundsKey = bounds.toBBoxString();
        if (prevBoundsRef.current !== boundsKey) {
            map.fitBounds(bounds, { padding: [60, 60] });
            prevBoundsRef.current = boundsKey;
        }
      }
    }
  }, [routes, map]);
  return null;
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
  const mapCenter = userLocation || [-2.5489, 118.0149]; 
  const initialZoom = userLocation ? 13 : 5;

  const MapEventsHandler = () => {
    useMapEvents({
      click(e) {
        if (!destinationPoint) {
            onMapClick(e.latlng);
        }
      },
    });
    return null;
  };

  const sortedRoutes = useMemo(() => 
    [...routes].sort((a) => a.isPrimary ? 1 : -1),
  [routes]);

  return (
    <MapContainer center={mapCenter} zoom={initialZoom} scrollWheelZoom={true} className="h-full w-full">
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
      />

      {departurePoint && (
        <Marker
          position={departurePoint}
          icon={startMarkerIcon}
          draggable={true}
          eventHandlers={{
            dragend: (e) => onMarkerDragEnd(e.target.getLatLng(), 'departure'),
          }}
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
      <MapController routes={routes} />
      <MapEventsHandler />
    </MapContainer>
  );
}