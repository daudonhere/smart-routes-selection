'use client';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';

const customMarkerIcon = new L.Icon({
  iconUrl: 'maps/marker.png',
  iconRetinaUrl: 'maps/marker.png',
  iconSize: [35, 61],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: undefined,
  shadowAnchor: [0, 0]
});

interface MapProps {
  center?: [number, number];
  zoom?: number;
  userLocation?: [number, number] | null;
}

function AutoZoom({ userLocation }: { userLocation: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(userLocation, 18); // Zoom maksimal
  }, [userLocation, map]);

  return null;
}

export default function MapComponent({ center, zoom = 13, userLocation }: MapProps) {
  const [domLoaded, setDomLoaded] = useState(false);
  const mapCenter = userLocation || center || [-6.9175, 107.6191];

  useEffect(() => {
    if (typeof window !== 'undefined' && L.Icon.Default) {
      delete ((L.Icon.Default.prototype as { _get?: () => void })._get);
    }
    setDomLoaded(true);
  }, []);

  if (!domLoaded) {
    return null;
  }

  return (
    <MapContainer center={mapCenter} zoom={zoom} scrollWheelZoom={true} className="h-full w-full rounded-t-lg">
      <TileLayer
        url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
      />
      {userLocation ? (
        <>
          <Marker position={userLocation} icon={customMarkerIcon}>
            <Popup>
              Your Location: <br /> {userLocation[0]}, {userLocation[1]}
            </Popup>
          </Marker>
          <AutoZoom userLocation={userLocation} />
        </>
      ) : (
        <Marker position={mapCenter} icon={customMarkerIcon}>
          <Popup>
            Default Location: <br /> {mapCenter[0]}, {mapCenter[1]}
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
