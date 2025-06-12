'use client';

import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useRef } from 'react';
import { RouteInfo } from '@/libs/types';
import 'leaflet-compass';
import 'leaflet-compass/dist/leaflet-compass.min.css';

interface MapWithCompass extends L.Map {
  _compass?: L.Control.Compass;
}

interface MapControllerProps {
  routes: RouteInfo[];
  departurePoint: [number, number] | null;
  destinationPoint: [number, number] | null;
}

export default function MapController({ routes, departurePoint, destinationPoint }: MapControllerProps) {
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
    const points: L.LatLngExpression[] = [];

    if (routes && routes.length > 0) {
      const allCoords = routes.flatMap((r) => r.coordinates);
      if (allCoords.length > 0) {
        points.push(...(allCoords as L.LatLngExpression[]));
      }
    } else {
      if (departurePoint) points.push(departurePoint);
      if (destinationPoint) points.push(destinationPoint);
    }

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      const boundsKey = bounds.toBBoxString();
      
      if (prevBoundsRef.current !== boundsKey) {
          map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
          prevBoundsRef.current = boundsKey;
      }
    }
  }, [routes, departurePoint, destinationPoint, map]);

  return null;
}