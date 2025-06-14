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
    <div className="flex flex-row w-full justify-center p-3 gap-4 2xl:gap-6">
      <div 
        onClick={() => handleSelection('motorbike')}
        className={`flex justify-center items-center p-2 rounded-md transition-all 2xl:p-4 ${
          isActionLocked 
            ? 'cursor-not-allowed' 
            : 'cursor-pointer hover:bg-yellow-200'
        } ${transportMode === 'motorbike' && !isActionLocked ? 'background-senary color-primary' : 'background-octonary color-tertiary'}`}
      >
        <Bike size={24} className="block 2xl:hidden" />
        <Bike size={32} className="hidden 2xl:block" />
      </div>
      <div
        onClick={() => handleSelection('car')}
        className={`flex justify-center items-center p-2 rounded-md transition-all 2xl:p-4 ${
          isActionLocked 
            ? 'cursor-not-allowed' 
            : 'cursor-pointer hover:bg-yellow-200'
        } ${transportMode === 'car' && !isActionLocked ? 'background-senary color-primary' : 'background-octonary color-tertiary'}`}
      >
        <Car size={24} className="block 2xl:hidden" />
        <Car size={32} className="hidden 2xl:block" />
      </div>
      <div
        onClick={() => handleSelection('truck')}
        className={`flex justify-center items-center p-2 rounded-md transition-all 2xl:p-4 ${
          isActionLocked 
            ? 'cursor-not-allowed' 
            : 'cursor-pointer hover:bg-yellow-200'
        } ${transportMode === 'truck' && !isActionLocked ? 'background-senary color-primary' : 'background-octonary color-tertiary'}`}
      >
        <Truck size={24} className="block 2xl:hidden" />
        <Truck size={32} className="hidden 2xl:block" />
      </div>
    </div>
  );
}