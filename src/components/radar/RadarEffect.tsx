'use client';

import { useState, useEffect, useRef } from 'react';
import { Circle } from 'react-leaflet';
import VehicleMarker from './VehicleMarker';

interface RadarEffectProps {
    center: [number, number];
}

export default function RadarEffect({ center }: RadarEffectProps) {
    const [radius, setRadius] = useState(500);
    const [vehiclePositions, setVehiclePositions] = useState<({ type: 'car' | 'bike', position: [number, number] })[]>([]);
    
    const frameRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);

    const minRadius = 500;
    const maxRadius = 3000;
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

                positions.push({
                    type: i < 3 ? 'car' : 'bike',
                    position: [centerLat + latOffset, centerLon + lonOffset]
                } as { type: 'car' | 'bike'; position: [number, number] });
            }
            setVehiclePositions(positions);
        };
        
        generateRandomPositions();
    }, [center, maxRadius]);

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