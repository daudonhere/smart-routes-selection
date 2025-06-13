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
    <div className="flex flex-row gap-4 py-4 w-full justify-center">
      <div 
        onClick={() => handleSelection('motorbike')}
        className={`p-3 rounded-md flex justify-center items-center transition-all ${
          isActionLocked 
            ? 'cursor-not-allowed' 
            : 'cursor-pointer hover:bg-yellow-200'
        } ${transportMode === 'motorbike' && !isActionLocked ? 'background-senary color-primary' : 'background-octonary color-tertiary'}`}
      >
        <Bike size={24} />
      </div>
      <div
        onClick={() => handleSelection('car')}
        className={`p-3 rounded-md flex justify-center items-center transition-all ${
          isActionLocked 
            ? 'cursor-not-allowed' 
            : 'cursor-pointer hover:bg-yellow-200'
        } ${transportMode === 'car' && !isActionLocked ? 'background-senary color-primary' : 'background-octonary color-tertiary'}`}
      >
        <Car size={24} />
      </div>
      <div
        onClick={() => handleSelection('truck')}
        className={`p-3 rounded-md flex justify-center items-center transition-all ${
          isActionLocked 
            ? 'cursor-not-allowed' 
            : 'cursor-pointer hover:bg-yellow-200'
        } ${transportMode === 'truck' && !isActionLocked ? 'background-senary color-primary' : 'background-octonary color-tertiary'}`}
      >
        <Truck size={24} />
      </div>
    </div>
  );
}