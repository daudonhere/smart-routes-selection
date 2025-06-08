// src/components/radar/VehicleMarker.tsx

'use client';

import { Marker } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';

interface VehicleMarkerProps {
    position: LatLngExpression;
    center: LatLngExpression;
    animatedRadius: number;
    iconUrl: string;
}

export default function VehicleMarker({ position, center, animatedRadius, iconUrl }: VehicleMarkerProps) {
    const distanceToCenter = L.latLng(center).distanceTo(position);
    const revealBandwidth = 1000;
    const difference = Math.abs(animatedRadius - distanceToCenter);
    
    let opacity = 0;
    if (difference < revealBandwidth) {
        opacity = 1 - (difference / revealBandwidth);
    }
    
    const icon = L.divIcon({
        html: `<img src="${iconUrl}" style="opacity: ${opacity}; transition: opacity 3s ease-in-out; width: 30px; height: 30px;" />`,
        className: 'vehicle-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
    });

    return <Marker position={position} icon={icon} />;
}