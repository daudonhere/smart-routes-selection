"use client"
import MapWrapper from '@/components/maps/MapWrapper';
import SearchBar from '@/components/search-bar';

export default function Home() {

    const handleSearch = (from: string, to: string) => {
      console.log('From:', from, 'To:', to);
    };
    
  return (
    <main className="flex flex-col h-screen w-screen p-0">
      <SearchBar onSubmit={handleSearch} />
      <MapWrapper />
    </main>
  );
}
