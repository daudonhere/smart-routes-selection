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

function MapController({
  departurePoint,
  destinationPoint,
  routes,
}: {
  departurePoint: [number, number] | null;
  destinationPoint: [number, number] | null;
  routes: RouteInfo[];
}) {
  const map = useMap() as L.Map & { _compass?: L.Control };
  const prevBoundsRef = useRef<string | null>(null);

  useEffect(() => {
    if (!map._compass) {
        const compassControl = L.control.compass({
            autoActive: true,
            showDigit: false,
            position: 'topright',
          });
        (map as L.Map & { _compass?: L.Control })._compass = compassControl;
        map.addControl(compassControl);
    }
  }, [map]);

  useEffect(() => {
    const points: L.LatLngExpression[] = [];
    if (routes && routes.length > 0) {
      const allCoords = routes.flatMap((r) => r.coordinates);
      if (allCoords.length > 0) {
        points.push(...allCoords as L.LatLngExpression[]);
      }
    } else {
      if (departurePoint) points.push(departurePoint);
      if (destinationPoint) points.push(destinationPoint);
    }
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      const boundsKey = bounds.toBBoxString();
      if (prevBoundsRef.current !== boundsKey) {
          map.fitBounds(bounds, { padding: [60, 60] });
          prevBoundsRef.current = boundsKey;
      }
    } else if (map.getZoom() > 6) {
        map.setView([-2.5489, 118.0149], 5);
    }
  }, [departurePoint, destinationPoint, routes, map]);
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
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"/>
      {departurePoint && (
        <Marker
          position={departurePoint}
          icon={startMarkerIcon}
          draggable={true}
          eventHandlers={{dragend: (e) => onMarkerDragEnd(e.target.getLatLng(), 'departure'),}}
        >
          <Popup>Lokasi Keberangkatan</Popup>
        </Marker>
      )}

      {destinationPoint && (
        <Marker
          position={destinationPoint}
          icon={endMarkerIcon}
          draggable={true}
          eventHandlers={{dragend: (e) => onMarkerDragEnd(e.target.getLatLng(), 'destination'),}}
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
      <MapController departurePoint={departurePoint} destinationPoint={destinationPoint} routes={routes}/>
      <MapEventsHandler />
    </MapContainer>
  );
}