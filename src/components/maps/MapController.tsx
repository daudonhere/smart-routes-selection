'use client';

import { useMap } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import { useEffect, useRef } from 'react';
import { RouteInfo } from '@/libs/types';
import 'leaflet-compass';
import 'leaflet-compass/dist/leaflet-compass.min.css';

interface MapWithCompass extends L.Map {
  _compass?: L.Control.Compass;
}

export default function MapController({ routes }: { routes: RouteInfo[] }) {
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
        const bounds = L.latLngBounds(allCoords as LatLngExpression[]);
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