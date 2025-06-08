'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, useMapEvents, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-compass/dist/leaflet-compass.min.css';
import L, { LatLngExpression } from 'leaflet';
import { useEffect, useRef, useMemo, useState } from 'react';
import { RouteInfo } from '@/libs/types';
import 'leaflet-compass';

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

function VehicleMarker({ position, center, animatedRadius, iconUrl }: {
    position: LatLngExpression;
    center: LatLngExpression;
    animatedRadius: number;
    iconUrl: string;
}) {
    const distanceToCenter = L.latLng(center).distanceTo(position);
    const revealBandwidth = 1000;
    const difference = Math.abs(animatedRadius - distanceToCenter);

    let opacity = 0;
    if (difference < revealBandwidth) {
        opacity = 1 - (difference / revealBandwidth);
    }
    
    const icon = L.divIcon({
        html: `<img src="${iconUrl}" style="opacity: ${opacity}; transition: opacity 5s ease-in-out; width: 30px; height: 30px;" />`,
        className: 'vehicle-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [1, -34],
    });

    return <Marker position={position} icon={icon} />;
}

function RadarEffect({ center }: { center: [number, number] }) {
    const [radius, setRadius] = useState(500);
    const [vehiclePositions, setVehiclePositions] = useState<({ type: 'car' | 'bike', position: [number, number] })[]>([]);

    const frameRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);

    const minRadius = 500;
    const maxRadius = 5000;
    const duration = 3000;

    useEffect(() => {
        const generateRandomPositions = () => {
            const positions = [];
            const [centerLat, centerLon] = center;

            for (let i = 0; i < 6; i++) {
                const randomDistance = Math.sqrt(Math.random()) * maxRadius;
                const randomAngle = Math.random() * 2 * Math.PI;

                const latOffset = (randomDistance * Math.cos(randomAngle)) / 111111;
                const lonOffset = (randomDistance * Math.sin(randomAngle)) / (111111 * Math.cos(centerLat * Math.PI / 180));
                
                const newLat = centerLat + latOffset;
                const newLon = centerLon + lonOffset;

                positions.push({
                    type: i < 3 ? 'car' : 'bike' as 'car' | 'bike',
                    position: [newLat, newLon] as [number, number]
                });
            }
            setVehiclePositions(positions);
        };
        
        generateRandomPositions();
    }, [center]);

    useEffect(() => {
        const animate = (timestamp: number) => {
            if (startTimeRef.current === null) startTimeRef.current = timestamp;
            const elapsedTime = timestamp - startTimeRef.current;
            const progress = (elapsedTime % duration) / duration;
            const currentRadius = minRadius + (maxRadius - minRadius) * progress;
            setRadius(currentRadius);
            frameRef.current = requestAnimationFrame(animate);
        };

        frameRef.current = requestAnimationFrame(animate);

        return () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
            startTimeRef.current = null;
        };
    }, []);

    return (
        <>
            <Circle
                center={center}
                radius={radius}
                pathOptions={{
                    color: '#f39c12',
                    fillColor: '#f1c40f',
                    weight: 0.2,
                    fillOpacity: 0.5 - (radius / (maxRadius * 2.2)),
                }}
            />
            {vehiclePositions.map((vehicle, index) => (
                <VehicleMarker
                    key={index}
                    position={vehicle.position}
                    center={center}
                    animatedRadius={radius}
                    iconUrl={vehicle.type === 'car' ? '/car/car-front.png' : '/bike/bike-front.png'}
                />
            ))}
        </>
    );
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

  const sortedRoutes = useMemo(
    () => [...routes].sort((a, b) => Number(a.isPrimary) - Number(b.isPrimary)),
    [routes]
  );

  return (
    <MapContainer center={mapCenter} zoom={initialZoom} scrollWheelZoom={true} className="h-full w-full">
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
      />
      
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
      <MapController routes={routes} />
      <MapEventsHandler />
    </MapContainer>
  );
}