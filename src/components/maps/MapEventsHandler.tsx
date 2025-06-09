'use client';

import { useMapEvents } from 'react-leaflet';
import L from 'leaflet';

interface MapEventsProps {
    onMapClick: (latlng: L.LatLng) => void;
    destinationPoint: [number, number] | null;
}

export default function MapEventsHandler({ onMapClick, destinationPoint }: MapEventsProps) {
    useMapEvents({
      click(e) {
        if (!destinationPoint) {
            onMapClick(e.latlng);
        }
      },
    });
  
    return null;
};