"use client"
import MapWrapper from "@/components/maps/MapWrapper";

export default function Home() {
    
  return (
    <main className="flex flex-1 h-screen w-screen background-primary">
      <div className="relative flex flex-1 flex-col">
        <div className="flex flex-1 p-8 z-10">
          <div className="flex flex-1 w-full h-3/4">
            <MapWrapper />
          </div>
        </div>
        <div className="absolute bottom-0 flex flex-1 w-full h-2/6 px-8 z-20">
          <div className="flex flex-col w-full h-full rounded-t-4xl background-nonary shadow-[0_-8px_20px_rgba(0,0,0,0.3)]">

          </div>
        </div>
      </div>
    </main>
  );
}
