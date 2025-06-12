'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useMemo, useRef } from 'react';
import { Timer, Route } from 'lucide-react';
import { RouteInfo, Driver, TransportMode, DriverDirection } from '@/libs/types';
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

const driverIcon = (type: TransportMode, direction: DriverDirection) => new L.Icon({
  iconUrl: `/${type}/${type}-${direction}.png`,
  iconSize: [40, 45],
  iconAnchor: [20, 22],
  className: 'leaflet-marker-transition'
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
  routes: RouteInfo[];
  onMapClick: (latlng: L.LatLng) => void;
  onMarkerDragEnd: (latlng: L.LatLng, type: 'departure' | 'destination') => void;
  onRouteSelect: (routeId: string) => void;
  isOffering: boolean;
  nearbyDrivers: Driver[];
  acceptingDriver: Driver | null;
  pickupRoute: RouteInfo | null;
  isDriverEnroute: boolean;
  driverPosition: [number, number] | null;
  driverDirection: DriverDirection;
  hasDriverArrived: boolean;
}

export default function MapComponent({
  userLocation,
  departurePoint,
  destinationPoint,
  routes,
  onMapClick,
  onMarkerDragEnd,
  onRouteSelect,
  isOffering,
  nearbyDrivers,
  acceptingDriver,
  pickupRoute,
  driverPosition,
  driverDirection,
  hasDriverArrived,
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
  
  const markerRef = useRef<L.Marker | null>(null);
  
  useEffect(() => {
    if ((acceptingDriver || hasDriverArrived) && markerRef.current) {
      setTimeout(() => {
        if (markerRef.current) {
          markerRef.current.openPopup();
        }
      }, 0);
    }
  }, [acceptingDriver, hasDriverArrived]);

  const finalDriverPosition = driverPosition || acceptingDriver?.position;
  const finalDriverIcon = acceptingDriver ? driverIcon(acceptingDriver.type, driverDirection) : undefined;

  return (
    <MapContainer center={mapCenter} zoom={initialZoom} scrollWheelZoom={true} className="h-full w-full">
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
      />
      
      <MapController 
        routes={pickupRoute ? [...routes, pickupRoute] : routes}
        departurePoint={departurePoint}
        destinationPoint={destinationPoint}
      />
      
      <MapEventsHandler onMapClick={onMapClick} destinationPoint={destinationPoint} />
      
      {isOffering && departurePoint && <RadarEffect center={departurePoint} drivers={nearbyDrivers} />}

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
          <Popup>Departure Location</Popup>
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
          <Popup>Destination Location</Popup>
        </Marker>
      )}

      {sortedRoutes.map((route) => (
        <Polyline
          key={route.id}
          positions={route.coordinates}
          pathOptions={{
            color: route.isPrimary ? '#FFBF00' : '#4B5563',
            weight: route.isPrimary ? 8 : 5,
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

      {pickupRoute && (
        <Polyline
          positions={pickupRoute.coordinates}
          pathOptions={{ color: '#FFBF00', weight: 4, opacity: 0.9, dashArray: '5, 10' }}
        />
      )}
      
      {acceptingDriver && finalDriverPosition && finalDriverIcon && (
        <Marker
          ref={markerRef}
          position={finalDriverPosition}
          icon={finalDriverIcon}
        >
          <Popup className="driver-popup" offset={[0, -20]}>
            <div className="text-center">
              {hasDriverArrived ? (
                  <span className="font-bold">Knock, Knock! Im Here</span>
              ) : (
                <>
                  <span className="font-bold">Hei im intersted with your offer</span>
                  <span className="font-bold">Im going to location soon!</span>
                  {pickupRoute && (
                    <div className='flex flex-row gap-2 mt-2 w-full items-center justify-center'>
                      <Route size={16} className='color-tertiary' />
                      <span className="font-bold text-xs color-senary">{pickupRoute.distance.toFixed(1)} Km</span>
                      <Timer size={16} className='color-tertiary' />
                      <span className="font-bold text-xs color-senary">{pickupRoute.duration.toFixed(0)} Minutes</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}