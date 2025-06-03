'use client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';

interface DefaultIcon extends L.Icon.Default {
  _get?: string;
}

delete (L.Icon.Default.prototype as DefaultIcon)._get;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'maps/marker-icon.png',
  iconUrl: 'maps/marker-icon.png',
  shadowUrl: 'leaflet/dist/images/marker-shadow.png',
});


interface MapProps {
  center?: [number, number];
  zoom?: number;
  userLocation?: [number, number] | null;
}

export default function MapComponent({ center, zoom = 13, userLocation }: MapProps) {
  const [domLoaded, setDomLoaded] = useState(false);
  const mapCenter = userLocation || center || [-6.9175, 107.6191];

  useEffect(() => {
    setDomLoaded(true);
  }, []);

  if (!domLoaded) {
    return null;
  }

  return (
    <MapContainer center={mapCenter} zoom={zoom} scrollWheelZoom={true} className="h-[500px] w-full rounded-md shadow-lg z-0">
      <TileLayer
        url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
      />
      {userLocation ? (
        <Marker position={userLocation}>
          <Popup>
            Your Location: <br /> {userLocation[0]}, {userLocation[1]}
          </Popup>
        </Marker>
      ) : (
        <Marker position={mapCenter}>
          <Popup>
            Default Location: <br /> {mapCenter[0]}, {mapCenter[1]}
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}