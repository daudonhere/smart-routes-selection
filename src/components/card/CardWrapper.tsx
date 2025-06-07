"use client";
import React, { useState } from 'react';
import { useRouteStore } from '@/stores/routesStore';
import { Car, Bike, CircleDollarSign, Info } from 'lucide-react';

const currencies = [
  { code: 'IDR', name: 'IDR (Rp)', symbol: 'Rp' },
  { code: 'USD', name: 'USD ($)', symbol: '$' },
  { code: 'SGD', name: 'SGD (S$)', symbol: 'S$' },
  { code: 'CNY', name: 'Yuan (¥)', symbol: '¥' },
  { code: 'INR', name: 'Rupee (₹)', symbol: '₹' },
];

export default function CardWrapper() {
  const departureAddress = useRouteStore((state) => state.departureAddress);
  const destinationAddress = useRouteStore((state) => state.destinationAddress);
  const transportMode = useRouteStore((state) => state.transportMode);
  const routes = useRouteStore((state) => state.routes);
  const isRouteLoading = useRouteStore((state) => state.isRouteLoading);
  const setTransportMode = useRouteStore((state) => state.setTransportMode);
  const setDepartureFromInput = useRouteStore((state) => state.setDepartureFromInput);
  const setDestinationFromInput = useRouteStore((state) => state.setDestinationFromInput);
  const fetchRoutes = useRouteStore((state) => state.fetchRoutes);

  const [pricePerKm, setPricePerKm] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0].code);
  const [submitted, setSubmitted] = useState(false);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    if (departureAddress.trim() && destinationAddress.trim()) {
      fetchRoutes();
    }
  };

  const isDepartureInvalid = submitted && !departureAddress.trim();
  const isDestinationInvalid = submitted && !destinationAddress.trim();
  const isPriceInvalid = submitted && !pricePerKm.trim();

  const getBorderStyle = (isInvalid: boolean) =>
    isInvalid ? 'border-red-500' : 'border-gray-600 focus:border-indigo-400';

  const calculateCost = (distance: number): number | null => {
    if (pricePerKm) {
        const price = parseFloat(pricePerKm);
        return !isNaN(price) ? price * distance : null;
    }
    return null;
  }

  const selectedCurrencySymbol = currencies.find(c => c.code === selectedCurrency)?.symbol || 'Rp';

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
          <input
            type="text"
            value={departureAddress}
            onChange={(e) => setDepartureFromInput(e.target.value)}
            placeholder="Lokasi keberangkatan (bisa digeser di peta)"
            className={`w-full px-3 py-2 bg-gray-800 border rounded-md shadow-sm outline-none ${getBorderStyle(isDepartureInvalid)}`}
          />
          <input
            type="text"
            value={destinationAddress}
            onChange={(e) => setDestinationFromInput(e.target.value)}
            placeholder="Tujuan (ketik atau klik/geser di peta)"
            className={`w-full px-3 py-2 bg-gray-800 border rounded-md shadow-sm outline-none ${getBorderStyle(isDestinationInvalid)}`}
          />
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={pricePerKm}
              onChange={(e) => /^\d*\.?\d*$/.test(e.target.value) && setPricePerKm(e.target.value)}
              placeholder="Harga per KM"
              className={`w-full px-3 py-2 bg-gray-800 border rounded-md shadow-sm outline-none ${getBorderStyle(isPriceInvalid)}`}
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
            disabled={isRouteLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-md focus:outline-none focus:shadow-outline disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
          >
            {isRouteLoading ? 'Menghitung Rute...' : 'Dapatkan Rute Optimal'}
          </button>
        </form>

        {routes.length > 0 && (
          <div className="mt-4 p-3 bg-gray-900/50 rounded-lg space-y-3">
            <h3 className="text-md font-semibold text-indigo-300">Hasil Perhitungan Rute</h3>
            {routes.map(route => {
              const totalCost = calculateCost(route.distance);
              return (
                <div key={route.id} className={`p-3 rounded-lg ${route.isPrimary ? 'bg-gray-800 ring-2 ring-indigo-400' : 'border border-dashed border-gray-700'}`}>
                  <p className="font-bold text-white flex items-center gap-2">
                    <Info size={16} className={route.isPrimary ? 'text-amber-400' : 'text-gray-400'} />
                    {route.isPrimary ? 'Rute Pilihan' : 'Alternatif'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                      <p>Jarak: <span className="font-bold text-white">{route.distance.toFixed(2)} km</span></p>
                      <p>Waktu Tempuh: <span className="font-bold text-white">{route.duration.toFixed(0)} menit</span></p>
                  </div>

                  <p className={`text-xs mt-1 ${route.hasToll ? 'text-amber-500' : 'text-green-500'}`}>
                    {transportMode === 'car'
                      ? (route.hasToll ? 'Rute ini kemungkinan melewati jalan tol.' : 'Rute ini adalah alternatif bebas tol.')
                      : 'Rute ini dirancang untuk motor dan menghindari tol.'}
                  </p>

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