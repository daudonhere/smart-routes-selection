"use client";

import { useRouteStore } from "@/stores/routesStore";
import { Bike, Car, Truck } from "lucide-react";

export default function TransportSelector() {
  const transportMode = useRouteStore((state) => state.transportMode);
  const setTransportMode = useRouteStore((state) => state.setTransportMode);

  return (
    <div className="flex flex-row gap-2 py-4 w-full justify-center">
      <div 
        onClick={() => setTransportMode('motorbike')}
        className={`cursor-pointer p-3 rounded-md flex justify-center items-center transition-all ${transportMode === 'motorbike' ? 'background-tertiary color-primary' : 'background-quaternary color-senary hover:bg-gray-600'}`}
      >
        <Bike size={24} />
      </div>
      <div
        onClick={() => setTransportMode('car')}
        className={`cursor-pointer p-3 rounded-md flex justify-center items-center transition-all ${transportMode === 'car' ? 'background-tertiary color-primary' : 'background-quaternary color-senary hover:bg-gray-600'}`}
      >
        <Car size={24} />
      </div>
      <div
        onClick={() => setTransportMode('truck')}
        className={`cursor-pointer p-3 rounded-md flex justify-center items-center transition-all ${transportMode === 'truck' ? 'background-tertiary color-primary' : 'background-quaternary color-senary hover:bg-gray-600'}`}
      >
        <Truck size={24} />
      </div>
    </div>
  );
}