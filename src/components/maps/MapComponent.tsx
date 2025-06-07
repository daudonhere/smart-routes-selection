'use client';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Tooltip, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-compass/dist/leaflet-compass.min.css';
import L from 'leaflet';
import { useEffect, useRef } from 'react';
import { RouteInfo, TransportMode } from '@/stores/routesStore';
import 'leaflet-compass';

const userMarkerIcon = new L.Icon({
  iconUrl: '/maps/marker.png',
  iconRetinaUrl: '/maps/marker.png',
  iconSize: [35, 61],
  iconAnchor: [17, 61],
  popupAnchor: [1, -34],
});
const destinationMarkerIcon = new L.Icon({
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
  transportMode: TransportMode;
  onMapClick: (latlng: L.LatLng) => void;
  onMarkerDragEnd: (latlng: L.LatLng, type: 'departure' | 'destination') => void;
  onRouteSelect: (routeId: string) => void;
  routes: RouteInfo[];
}

function MapController({ departurePoint, destinationPoint, routes }: { departurePoint: [number, number] | null, destinationPoint: [number, number] | null, routes: RouteInfo[] }) {
  const map = useMap();
  const prevBoundsRef = useRef<string | null>(null);

  useEffect(() => {
    const compassControl = L.control.compass({
        autoActive: true,
        showDigit: true,
        position: 'topright'
    });
    map.addControl(compassControl);
    return () => { map.removeControl(compassControl); };
  }, [map]);

  useEffect(() => {
    if (routes && routes.length > 0) {
      const allCoords = routes.flatMap(r => r.coordinates);
      const bounds = L.latLngBounds(allCoords);
      const boundsKey = bounds.toBBoxString();
      if(prevBoundsRef.current !== boundsKey) {
        map.fitBounds(bounds, { padding: [50, 50] });
        prevBoundsRef.current = boundsKey;
      }
    } else {
        const points: L.LatLngExpression[] = [];
        if (departurePoint) points.push(departurePoint);
        if (destinationPoint) points.push(destinationPoint);
        if (points.length > 1) {
            const bounds = L.latLngBounds(points);
            const boundsKey = bounds.toBBoxString();
            if(prevBoundsRef.current !== boundsKey) {
                map.fitBounds(bounds, { padding: [50, 50] });
                prevBoundsRef.current = boundsKey;
            }
        }
    }
  }, [departurePoint, destinationPoint, routes, map]);

  return null;
}

export default function MapComponent({
    userLocation,
    departurePoint,
    destinationPoint,
    transportMode,
    onMapClick,
    onMarkerDragEnd,
    onRouteSelect,
    routes
}: MapProps) {
  const mapCenter = userLocation || [-6.2088, 106.8456]; // Default Jakarta

  const MapEventsHandler = () => {
    useMapEvents({
      click(e) {
        onMapClick(e.latlng);
      },
    });
    return null;
  };

  return (
    <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={true} className="h-full w-full">
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

      {departurePoint && (
        <Marker
          position={departurePoint}
          icon={userMarkerIcon}
          draggable={true}
          eventHandlers={{ dragend: (e) => onMarkerDragEnd(e.target.getLatLng(), 'departure') }}
        >
          <Popup>Lokasi Keberangkatan</Popup>
        </Marker>
      )}

      {destinationPoint && (
        <Marker
          position={destinationPoint}
          icon={destinationMarkerIcon}
          draggable={true}
          eventHandlers={{ dragend: (e) => onMarkerDragEnd(e.target.getLatLng(), 'destination') }}
        >
          <Popup>Tujuan</Popup>
        </Marker>
      )}

      {routes.map((route) => (
        <Polyline
          key={route.id}
          positions={route.coordinates}
          pathOptions={{
            color: route.isPrimary ? '#FFBF00' : '#6B7280',
            weight: route.isPrimary ? 7 : 5,
            opacity: route.isPrimary ? 0.9 : 0.75,
            className: route.isPrimary ? '' : 'cursor-pointer'
          }}
          eventHandlers={{
            click: () => {
              if (!route.isPrimary) {
                onRouteSelect(route.id);
              }
            }
          }}
        >
          <Tooltip sticky>
            <b>{route.isPrimary ? 'Rute Pilihan' : 'Alternatif'}</b> <br/>
            Jarak: {route.distance.toFixed(2)} km <br/>
            Waktu: {route.duration.toFixed(0)} menit <br/>
            {transportMode === 'car' && (
                <span style={{color: route.hasToll ? 'orange' : 'lightgreen'}}>
                    {route.hasToll ? '(Via Tol)' : '(Bebas Tol)'}
                </span>
            )}
            {!route.isPrimary && (
                <div style={{marginTop: '5px', fontStyle: 'italic', color: '#a5b4fc'}}>
                    Klik garis untuk pilih rute ini
                </div>
            )}
          </Tooltip>
        </Polyline>
      ))}

      <MapController departurePoint={departurePoint} destinationPoint={destinationPoint} routes={routes} />
      <MapEventsHandler />
    </MapContainer>
  );
}