'use client';

import { useState, useEffect, useRef } from 'react';
import { Circle } from 'react-leaflet';
import VehicleMarker from './VehicleMarker';
import { Driver, TransportMode } from '@/libs/types';

interface RadarEffectProps {
    center: [number, number];
    drivers: Driver[];
}

export default function RadarEffect({ center, drivers }: RadarEffectProps) {
    const [radius, setRadius] = useState(500);
    const frameRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const minRadius = 500;
    const maxRadius = 3000;
    const duration = 3000;

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
            if (frameRef.current) {
              cancelAnimationFrame(frameRef.current);
            }
            startTimeRef.current = null;
        };
    }, []);

    const getIconUrl = (type: TransportMode): string => {
        switch (type) {
            case 'car': return '/car/car-front.png';
            case 'motorbike': return '/motorbike/motorbike-front.png';
            case 'truck': return '/truck/truck-front.png';
            default: return '/car/car-front.png';
        }
    }
    
    return (
        <>
            <Circle
                center={center}
                radius={radius}
                pathOptions={{
                    color: '#f39c12',
                    fillColor: '#ffef86',
                    weight: 0.2,
                    fillOpacity: 0.5 - (radius / (maxRadius * 2.2)),
                }}
            />
            {drivers.map((driver) => (
                <VehicleMarker
                    key={driver.id}
                    position={driver.position}
                    center={center}
                    animatedRadius={radius}
                    iconUrl={getIconUrl(driver.type)}
                />
            ))}
        </>
    );
}