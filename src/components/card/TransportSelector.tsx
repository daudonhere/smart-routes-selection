"use client";

import { useRouteStore } from "@/stores/routesStore";
import { Bike, Car, Truck } from "lucide-react";

export default function TransportSelector() {
  const transportMode = useRouteStore((state) => state.transportMode);
  const setTransportMode = useRouteStore((state) => state.setTransportMode);
  const isActionLocked = useRouteStore((state) => state.isActionLocked);

  const handleSelection = (mode: 'motorbike' | 'car' | 'truck') => {
    if (isActionLocked) return;
    setTransportMode(mode);
  }

  return (
    <div className="flex flex-row gap-2 py-4 w-full justify-center">
      <div 
        onClick={() => handleSelection('motorbike')}
        className={`p-3 rounded-md flex justify-center items-center transition-all ${
          isActionLocked 
            ? 'opacity-50 pointer-events-none' 
            : 'cursor-pointer hover:bg-gray-600'
        } ${transportMode === 'motorbike' && !isActionLocked ? 'background-tertiary color-primary' : 'background-quaternary color-senary'}`}
      >
        <Bike size={24} />
      </div>
      <div
        onClick={() => handleSelection('car')}
        className={`p-3 rounded-md flex justify-center items-center transition-all ${
          isActionLocked 
            ? 'opacity-50 pointer-events-none' 
            : 'cursor-pointer hover:bg-gray-600'
        } ${transportMode === 'car' && !isActionLocked ? 'background-tertiary color-primary' : 'background-quaternary color-senary'}`}
      >
        <Car size={24} />
      </div>
      <div
        onClick={() => handleSelection('truck')}
        className={`p-3 rounded-md flex justify-center items-center transition-all ${
          isActionLocked 
            ? 'opacity-50 pointer-events-none' 
            : 'cursor-pointer hover:bg-gray-600'
        } ${transportMode === 'truck' && !isActionLocked ? 'background-tertiary color-primary' : 'background-quaternary color-senary'}`}
      >
        <Truck size={24} />
      </div>
    </div>
  );
}