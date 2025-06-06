'use client';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Tooltip, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useRef } from 'react';
import { RouteInfo } from '@/stores/routesStore';

const userMarkerIcon = new L.Icon({
  iconUrl: 'maps/marker.png',
  iconRetinaUrl: 'maps/marker.png',
  iconSize: [35, 61],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: undefined,
  shadowAnchor: [0, 0]
});
const destinationMarkerIcon = new L.Icon({
  iconUrl: 'maps/marker.png',
  iconRetinaUrl: 'maps/marker.png',
  iconSize: [35, 61],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: undefined,
  shadowAnchor: [0, 0]
});


interface MapProps {
  userLocation: [number, number] | null;
  destination: [number, number] | null;
  onMapClick: (latlng: L.LatLng) => void;
  routes: RouteInfo[];
}

function AutoZoomPan({ userLocation, destination, routes }: { userLocation: [number, number] | null, destination: [number, number] | null, routes: RouteInfo[] }) {
  const map = useMap();
  const prevBoundsRef = useRef<string | null>(null);

  useEffect(() => {
    if (routes && routes.length > 0) {
      const allCoords = routes.flatMap(r => r.coordinates);
      const bounds = L.latLngBounds(allCoords);
      const boundsKey = bounds.toBBoxString();
      if(prevBoundsRef.current !== boundsKey) {
        map.fitBounds(bounds, { padding: [50, 50] });
        prevBoundsRef.current = boundsKey;
      }
    } 
    else if (userLocation && destination) {
      const bounds = L.latLngBounds([userLocation, destination]);
      const boundsKey = bounds.toBBoxString();
      if(prevBoundsRef.current !== boundsKey) {
        map.fitBounds(bounds, { padding: [50, 50] });
        prevBoundsRef.current = boundsKey;
      }
    } 
    else if (userLocation) {
        const currentZoom = map.getZoom();
        const targetZoom = 16;
        if (!map.getBounds().contains(userLocation) || currentZoom < 14) {
             map.setView(userLocation, targetZoom);
        }
    }
  }, [userLocation, destination, routes, map]);

  return null;
}

function MapEvents({ onMapClick }: { onMapClick: (latlng: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

export default function MapComponent({ userLocation, destination, onMapClick, routes }: MapProps) {
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/maps/marker.png',
      iconUrl: '/maps/marker.png',
      shadowUrl: '/maps/marker-shadow.png',
    });
  }, []);

  const mapCenter = userLocation || [-6.9217, 106.9095];

  return (
    <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={true} className="h-full w-full">
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {userLocation && (
        <Marker position={userLocation} icon={userMarkerIcon}>
          <Popup>Your Location</Popup>
        </Marker>
      )}

      {destination && (
        <Marker position={destination} icon={destinationMarkerIcon}>
          <Popup>Destination</Popup>
        </Marker>
      )}

      {routes.map((route) => (
        <Polyline
          key={route.id}
          positions={route.coordinates}
          pathOptions={{
            color: route.isPrimary ? '#FFBF00' : '#6B7280',
            weight: route.isPrimary ? 6 : 4,
            opacity: route.isPrimary ? 0.9 : 0.7,
          }}
        >
          <Tooltip sticky>
            {route.isPrimary ? 'Optimal Route' : 'Alternative Route'} <br/>
            Distance: {route.distance.toFixed(2)} km <br/>
            Time: {route.duration.toFixed(0)} mins
            {route.hasToll && <div style={{color: 'orange'}}> (Includes Toll)</div>}
          </Tooltip>
        </Polyline>
      ))}
      <AutoZoomPan userLocation={userLocation} destination={destination} routes={routes} />
      <MapEvents onMapClick={onMapClick} />
    </MapContainer>
  );
}