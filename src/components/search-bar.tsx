'use client';
import { useState } from 'react';

interface Props {
  onSubmit: (from: string, to: string) => void;
}

export default function SearchBar({ onSubmit }: Props) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (from && to) {
      onSubmit(from, to);
    }
  };

  return (
    <div className="absolute flex w-full px-28 p-2 top-12 z-30">
      <div className="flex p-2 bg-white/90 backdrop-blur-md shadow-md rounded-lg w-full">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full">
          <input
            type="text"
            placeholder="From (Departure)"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full py-1.5 px-3 text-sm rounded-md border border-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          <input
            type="text"
            placeholder="To (Destination)"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full py-1.5 px-3 text-sm rounded-md border border-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </form>
      </div>
    </div>
  );
}
