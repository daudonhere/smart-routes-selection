"use client";

import DesktopCardWrapper from "@/components/card/DesktopCardWrapper";
import MobileCardWrapper from "@/components/card/MobileCardWrapper";
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
        subtitle="Location will be set randomly if GPS not active" 
      />
    );
  }
  
  return (
    <main className="flex h-screen w-screen overflow-hidden background-primary">
      <div className="flex flex-1 flex-col lg:flex-row">
        <div className="hidden lg:flex w-[20%] 2xl:w-[15%] h-full background-secondary z-20 border-r line-tertiary rounded-r-xl shadow-[10px_0px_22px_rgba(180,180,180,0.2)]">
            <DesktopCardWrapper />
        </div>
        <div className="flex-1 background-secondary z-10">
          <MapWrapper/>
        </div>
        <div className="flex lg:hidden h-[40%] w-full p-4 background-secondary z-20 border-t line-tertiary">
            <MobileCardWrapper />
        </div>
      </div>
    </main>
  );
}