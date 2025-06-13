'use client';

import { useMapEvents } from 'react-leaflet';
import L from 'leaflet';

interface MapEventsProps {
    onMapClick: (latlng: L.LatLng) => void;
    destinationPoint: [number, number] | null;
    isDisabled: boolean;
}

export default function MapEventsHandler({ onMapClick, isDisabled }: MapEventsProps) {
    useMapEvents({
      click(e) {
        if (!isDisabled) {
          onMapClick(e.latlng);
        }
      },
    });
  
    return null;
}