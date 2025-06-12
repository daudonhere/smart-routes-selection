"use client";

import React, { useState } from 'react';
import { useRouteStore } from '@/stores/routesStore';
import TransportSelector from './TransportSelector';
import RouteForm from './RouteForm';
import RouteResultCard from './RouteResultCard';

const currencies = [
  { code: 'IDR', name: 'IDR', symbol: 'Rp' },
  { code: 'USD', name: 'USD', symbol: '$' },
  { code: 'SGD', name: 'SGD', symbol: '$' },
  { code: 'JPY', name: 'YEN', symbol: '¥' },
  { code: 'CNY', name: 'YUAN', symbol: '¥' },
];

export default function CardWrapper() {
  const routes = useRouteStore((state) => state.routes);
  const error = useRouteStore((state) => state.error);
  const isRouteLoading = useRouteStore((state) => state.isRouteLoading);
  const [pricePerKm, setPricePerKm] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0].code);
  const selectedCurrencySymbol = currencies.find(c => c.code === selectedCurrency)?.symbol || 'Rp';

  const calculateCost = (distance: number): number | null => {
    if (pricePerKm) {
        const price = parseFloat(pricePerKm);
        return !isNaN(price) ? price * distance : null;
    }
    return null;
  }

  return (
    <div className="flex flex-col gap-2 h-full">
      <TransportSelector />
      <div className="flex flex-row gap-2 w-full">
        <RouteForm 
          pricePerKm={pricePerKm}
          setPricePerKm={setPricePerKm}
          selectedCurrency={selectedCurrency}
          setSelectedCurrency={setSelectedCurrency}
          currencies={currencies}
        />
      </div>
      <div className="flex flex-1 flex-col py-2 w-full overflow-y-auto">
        {error && !isRouteLoading && (
            <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-center text-red-300">
                {error}
            </div>
        )}
        {routes.length > 0 && !isRouteLoading && (
          <div className="flex flex-col gap-6">
            {routes.map((route) => (
              <RouteResultCard 
                key={route.id}
                route={route}
                totalCost={calculateCost(route.distance)}
                currencySymbol={selectedCurrencySymbol}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}