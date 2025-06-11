"use client";

import CardWrapper from "@/components/card/CardWrapper";
import MapWrapper from "@/components/maps/MapWrapper";
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
      <div className="flex flex-col items-center justify-center h-screen w-screen text-center bg-background-primary text-text-primary">
        <svg className="animate-spin h-12 w-12 text-indigo-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-lg font-semibold">Loading Location...</p>
        <p className="text-sm text-text-secondary">Please Provide Location..</p>
      </div>
    );
  }
  
  return (
    <main className="flex h-screen w-screen overflow-hidden background-primary">
     <div className="relative flex flex-1 lg:flex-row sm:flex-col">
        <div className="absolute left-0 w-[20%] h-full p-2 background-secondary border-r line-quinary rounded-r-xl shadow-[10px_0px_22px_rgba(180,180,180,0.2)] z-20">
            <CardWrapper/>
        </div>
        <div className="absolute right-0 w-[80%] h-full background-secondary z-10">
          <MapWrapper/>
        </div>
     </div>
    </main>
  );
}