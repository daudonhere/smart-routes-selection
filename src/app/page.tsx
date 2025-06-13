"use client";

import CardWrapper from "@/components/card/CardWrapper";
import MapWrapper from "@/components/maps/MapWrapper";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useRouteStore } from "@/stores/routesStore";
import { useEffect } from "react";

export default function Home() {
  const initializeLocation = useRouteStore((state) => state.initializeLocation);
  const isMapLoading = useRouteStore((state) => state.isMapLoading);

  useEffect(() => {
    initializeLocation();
  }, [initializeLocation]);

  if (isMapLoading) {
    return (
      <LoadingSpinner 
        title="Loading Location..." 
        subtitle="Location will be set randomly if GPS not working properly" 
      />
    );
  }
  
  return (
    <main className="flex h-screen w-screen overflow-hidden background-primary">
     <div className="relative flex flex-1 lg:flex-row sm:flex-col">
        <div className="absolute left-0 w-[25%] h-full py-2 px-6 background-secondary border-r line-tertiary rounded-r-xl shadow-[10px_0px_22px_rgba(180,180,180,0.2)] z-20">
            <CardWrapper/>
        </div>
        <div className="absolute right-0 w-[75%] h-full background-secondary z-10">
          <MapWrapper/>
        </div>
     </div>
    </main>
  );
}