"use client";

import React, { useState } from 'react';
import { useRouteStore } from '@/stores/routesStore';
import { Car, Bike, CircleDollarSign, Info, Route, AlertTriangle } from 'lucide-react';
import { RouteInfo } from '@/libs/types';
import AutocompleteInput from './AutocompleteInput';

const currencies = [
  { code: 'IDR', name: 'IDR', symbol: 'Rp' },
  { code: 'USD', name: 'USD', symbol: '$' },
  { code: 'SGD', name: 'SGD', symbol: '$' },
  { code: 'JPY', name: 'Yen', symbol: '¥' },
  { code: 'CNY', name: 'Yuan', symbol: '¥' },
  { code: 'INR', name: 'Rupee', symbol: '₹' },
];

export default function CardWrapper() {
  const includeTolls = useRouteStore((state) => state.includeTolls);
  const setIncludeTolls = useRouteStore((state) => state.setIncludeTolls);
  const departureAddress = useRouteStore((state) => state.departureAddress);
  const destinationAddress = useRouteStore((state) => state.destinationAddress);
  const transportMode = useRouteStore((state) => state.transportMode);
  const routes = useRouteStore((state) => state.routes);
  const isRouteLoading = useRouteStore((state) => state.isRouteLoading);
  const setTransportMode = useRouteStore((state) => state.setTransportMode);
  const setDepartureFromInput = useRouteStore((state) => state.setDepartureFromInput);
  const setDestinationFromInput = useRouteStore((state) => state.setDestinationFromInput);
  const fetchRoutes = useRouteStore((state) => state.fetchRoutes);
  const setActiveRoute = useRouteStore((state) => state.setActiveRoute);
  const error = useRouteStore((state) => state.error);
  const setPoint = useRouteStore((state) => state.setPoint);
  const [pricePerKm, setPricePerKm] = useState('0');
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0].code);
  const selectedCurrencySymbol = currencies.find(c => c.code === selectedCurrency)?.symbol || 'Rp';
  const isButtonDisabled = isRouteLoading || !departureAddress.trim() || !destinationAddress.trim() || !pricePerKm.trim();

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchRoutes();
  };

  const calculateCost = (distance: number): number | null => {
    if (pricePerKm) {
        const price = parseFloat(pricePerKm);
        return !isNaN(price) ? price * distance : null;
    }
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-background-secondary rounded-t-4xl shadow-[0_-8px_20px_rgba(0,0,0,0.5)] p-4 text-text-primary overflow-y-auto">
      <div className="w-full max-w-lg mx-auto">
        <div className="flex justify-center gap-6 mb-4">
          <div
            onClick={() => setTransportMode('motorbike')}
            className={`cursor-pointer p-3 rounded-lg flex flex-col items-center gap-1 transition-all ${transportMode === 'motorbike' ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            <Bike size={28} />
            <span className="text-xs font-semibold">Motor</span>
          </div>
          <div
            onClick={() => setTransportMode('car')}
            className={`cursor-pointer p-3 rounded-lg flex flex-col items-center gap-1 transition-all ${transportMode === 'car' ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            <Car size={28} />
            <span className="text-xs font-semibold">Mobil</span>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-3">
          <AutocompleteInput
            value={departureAddress}
            onValueChange={setDepartureFromInput}
            onSelect={(location) => setPoint('departure', location)}
            placeholder="Lokasi keberangkatan"
          />
          <AutocompleteInput
            value={destinationAddress}
            onValueChange={setDestinationFromInput}
            onSelect={(location) => setPoint('destination', location)}
            placeholder="Tujuan"
          />

          {transportMode === 'car' && (
            <div className="flex items-center justify-start py-1">
              <input
                type="checkbox"
                id="includeTolls"
                checked={includeTolls}
                onChange={(e) => setIncludeTolls(e.target.checked)}
                className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="includeTolls" className="ml-2 block text-sm text-gray-300">
                Sertakan rute via Tol
              </label>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={pricePerKm}
              onChange={(e) => /^\d*\.?\d*$/.test(e.target.value) && setPricePerKm(e.target.value)}
              placeholder="Harga per KM"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md shadow-sm outline-none focus:border-indigo-400"
            />
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md shadow-sm outline-none focus:border-indigo-400"
            >
              {currencies.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>

          <button
            type="submit"
            disabled={isButtonDisabled}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-md focus:outline-none focus:shadow-outline disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
          >
            {isRouteLoading ? 'Menghitung Rute...' : 'Dapatkan Rute Optimal'}
          </button>
        </form>

        {error && !isRouteLoading && (
            <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-center text-red-300">
                {error}
            </div>
        )}

        {routes.length > 0 && !isRouteLoading && (
          <div className="mt-4 p-3 bg-gray-900/50 rounded-lg space-y-3">
            <h3 className="text-md font-semibold text-indigo-300 flex items-center gap-2"><Route size={20}/> Hasil Perhitungan Rute</h3>
            {routes.map((route: RouteInfo) => { 
              const totalCost = calculateCost(route.distance);
              const isSlowSpeed = route.averageSpeed < 30;

              return (
                <div key={route.id} onClick={() => !route.isPrimary && setActiveRoute(route.id)} className={`p-3 rounded-lg transition-all ${route.isPrimary ? 'bg-gray-800 ring-2 ring-indigo-400' : 'border border-dashed border-gray-700 hover:bg-gray-800/50 cursor-pointer'}`}>
                  <p className="font-bold text-white flex items-center gap-2">
                    <Info size={16} className={route.isPrimary ? 'text-amber-400' : 'text-gray-400'} />
                    {route.isPrimary ? 'Rute Pilihan' : 'Rute Alternatif'}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                      <p>Jarak: <span className="font-bold text-white">{route.distance.toFixed(2)} km</span></p>
                      <p>Waktu: <span className="font-bold text-white">{route.duration.toFixed(0)} menit</span></p>
                      <p>Kecepatan Rata-rata: <span className="font-bold text-white col-span-2">{route.averageSpeed.toFixed(0)} km/jam</span></p>
                  </div>
                  <p className={`text-xs mt-1 ${route.hasToll ? 'text-amber-500' : 'text-green-500'}`}>
                    {transportMode === 'car'
                      ? (route.hasToll ? 'Rute ini melewati jalan tol.' : 'Rute ini adalah alternatif bebas tol.')
                      : 'Rute ini dirancang untuk motor (menghindari tol).'}
                  </p>
                  {isSlowSpeed && (
                    <div className="mt-2 p-2 bg-yellow-900/50 border border-yellow-700 rounded-md text-yellow-300 text-xs flex items-center gap-2">
                      <AlertTriangle size={16} />
                      <span>Rute mungkin padat meskipun ini rute terbaik.</span>
                    </div>
                  )}
                  {totalCost !== null && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <p className="text-sm font-medium text-green-400 flex items-center gap-2">
                          <CircleDollarSign size={18} />
                          Estimasi Biaya:
                          <span className={`font-bold text-white ${route.isPrimary ? 'text-lg' : 'text-base'}`}>
                              {selectedCurrencySymbol} {totalCost.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </span>
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}