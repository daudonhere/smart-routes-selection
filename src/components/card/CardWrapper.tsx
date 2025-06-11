"use client";

import React, { useState } from 'react';
import { useRouteStore } from '@/stores/routesStore';
import { Car, Bike, Truck, Info, Route, Gauge, Timer, TrafficCone, AlertTriangle, CircleDollarSign } from 'lucide-react';
import { RouteInfo } from '@/libs/types';
import AutocompleteInput from './AutocompleteInput';

const currencies = [
  { code: 'IDR', name: 'IDR', symbol: 'Rp' },
  { code: 'USD', name: 'USD', symbol: '$' },
  { code: 'SGD', name: 'SGD', symbol: '$' },
  { code: 'JPY', name: 'YEN', symbol: '¥' },
  { code: 'CNY', name: 'YUAN', symbol: '¥' },
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
  const isOffering = useRouteStore((state) => state.isOffering);
  const startOfferSimulation = useRouteStore((state) => state.startOfferSimulation);
  const acceptingDriver = useRouteStore((state) => state.acceptingDriver);
  const cancelOffer = useRouteStore((state) => state.cancelOffer);
  const [pricePerKm, setPricePerKm] = useState('');
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
    <div className="flex flex-col gap-2 h-full">
        <div className="flex flex-row gap-2 py-4 w-full h-[10%] justify-center">
          <div onClick={() => setTransportMode('motorbike')}
            className={`cursor-pointer p-3 rounded-md flex justify-center items-center transition-all ${transportMode === 'motorbike' ? 'background-tertiary color-primary' : 'background-quaternary color-senary hover:bg-gray-600'}`}
          >
            <Bike size={24} />
          </div>
          <div
            onClick={() => setTransportMode('car')}
            className={`cursor-pointer p-3 rounded-md flex justify-center items-center transition-all ${transportMode === 'car' ? 'background-tertiary color-primary' : 'background-quaternary color-senary hover:bg-gray-600'}`}
          >
            <Car size={24} />
          </div>
          <div
            onClick={() => setTransportMode('truck')}
            className={`cursor-pointer p-3 rounded-md flex justify-center items-center transition-all ${transportMode === 'truck' ? 'background-tertiary color-primary' : 'background-quaternary color-senary hover:bg-gray-600'}`}
          >
            <Truck size={24} />
          </div>
        </div>
        <div className="flex flex-row gap-2 w-full h-[30%]">
          <form onSubmit={handleFormSubmit} className="flex flex-col gap-2 w-full">
            <AutocompleteInput
              value={departureAddress}
              onValueChange={setDepartureFromInput}
              onSelect={(location) => setPoint('departure', location)}
              placeholder="Departure"
            />
            <AutocompleteInput
              value={destinationAddress}
              onValueChange={setDestinationFromInput}
              onSelect={(location) => setPoint('destination', location)}
              placeholder="Destination"
            />
  
            {(transportMode === 'car' || transportMode === 'truck') && (
              <div className="ml-1 flex items-center justify-start">
                <input
                  type="checkbox"
                  id="includeTolls"
                  checked={includeTolls}
                  onChange={(e) => setIncludeTolls(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-tertiary focus:ring-tertiary"
                />
                <label htmlFor="includeTolls" className="ml-2 block text-sm color-senary">
                  Toll Road
                </label>
              </div>
            )}
  
            <div className="flex flex-row items-center gap-2">
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="cursor-pointer px-2 py-1 background-quaternary border line-quinary rounded-md shadow-sm outline-none focus:border-yellow-300 color-senary"
              >
                {currencies.map(c => 
                  <option key={c.code} value={c.code} className='background-secondary color-senary'>
                      {c.name}
                  </option>
                )}
              </select>
              <input
                type="text"
                inputMode="decimal"
                value={pricePerKm}
                onChange={(e) => /^\d*\.?\d*$/.test(e.target.value) && setPricePerKm(e.target.value)}
                placeholder="Price/KM"
                className="w-full py-1 px-2 background-quaternary border line-quinary rounded-md shadow-sm outline-none focus:border-yellow-300 color-senary"
              />
            </div>
  
            <button
              type="submit"
              disabled={isButtonDisabled}
              className="cursor-pointer w-full mt-1 background-tertiary hover:bg-yellow-400 color-primary font-bold py-1.5 px-4 rounded-md focus:outline-none focus:shadow-outline disabled:background-quinary disabled:cursor-not-allowed transition-colors"
            >
              {isRouteLoading ? 'Calculating...' : 'Search Routes'}
            </button>
          </form>
        </div>

        <div className="flex flex-1 flex-col py-2 w-full overflow-y-auto">
          {error && !isRouteLoading && (
              <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-center text-red-300">
                  {error}
              </div>
          )}
          {routes.length > 0 && !isRouteLoading && (
            <div className="flex flex-col gap-6">
              {routes.map((route: RouteInfo) => { 
                const totalCost = calculateCost(route.distance);
                const isSlowSpeed = route.averageSpeed < 30;
                const showTollFeeWarning = (transportMode === 'car' || transportMode === 'truck') && route.hasToll;
                const lowerSpeed = route.averageSpeed;
                const upperSpeed = lowerSpeed + 10;
                const hasDriver = !!acceptingDriver;
                const isCardClickable = !route.isPrimary && !hasDriver;
                let buttonText = 'Offer';
                let buttonAction = () => {};
                let isButtonDisabledForThisCard = true;

                if (route.isPrimary) {
                  if (hasDriver) {
                    buttonText = 'Cancel';
                    buttonAction = cancelOffer;
                    isButtonDisabledForThisCard = false;
                  } else if (isOffering) {
                    buttonText = 'Mencari Driver...';
                    isButtonDisabledForThisCard = true;
                  } else {
                    buttonText = 'Offer';
                    buttonAction = startOfferSimulation;
                    isButtonDisabledForThisCard = false;
                  }
                } else {
                  buttonText = 'Offer';
                  isButtonDisabledForThisCard = true;
                }

                return (
                  <div 
                    key={route.id} 
                    onClick={isCardClickable ? () => setActiveRoute(route.id) : undefined} 
                    className={`p-3 rounded-lg transition-all ${route.isPrimary ? 'background-primary border-2 line-tertiary shadow-lg shadow-tertiary/20' : 'background-primary border-2 line-quinary'} ${isCardClickable ? 'hover:line-doctary cursor-pointer' : ''} ${!isCardClickable && !route.isPrimary ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <p className="font-bold color-tertiary flex items-center gap-2">
                      <Info size={16} className={route.isPrimary ? 'color-tertiary' : 'color-quinary'} />
                      {route.isPrimary ? 'Preferred Route' : 'Alternative Route'}
                    </p>
                     <div className="flex flex-col gap-2 w-full mt-1">
                      <div className="flex flex-row gap-6">
                        <div className='flex flex-row gap-1 w-full items-center'>
                          <Route size={16} className={route.isPrimary ? 'color-tertiary' : 'color-quinary'} />
                          <span className="font-bold text-xs color-senary">{route.distance.toFixed(2)} KM</span>
                        </div>
                        <div className='flex flex-row gap-1 w-full items-center'>
                          <Gauge size={16} className={route.isPrimary ? 'color-tertiary' : 'color-quinary'} />
                          <span className="font-bold text-xs color-senary">
                            {`${lowerSpeed.toFixed(0)} - ${upperSpeed.toFixed(0)} Kmh`}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-row gap-6">
                        <div className='flex flex-row gap-1 w-full items-center'>
                          <Timer size={16} className={route.isPrimary ? 'color-tertiary' : 'color-quinary'} />
                          <span className="font-bold text-xs color-senary">{route.duration.toFixed(0)} Minutes</span>
                        </div>
                        <div className='flex flex-row gap-1 w-full items-center'>
                          <TrafficCone size={16} className={route.isPrimary ? 'color-tertiary' : 'color-quinary'} />
                          <span className="font-bold text-xs color-senary">
                          {transportMode === 'motorbike'
                            ? 'Outside Toll'
                            : (route.hasToll ? 'Via Toll' : 'Without Toll')
                          }
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-1 mt-1">
                        {isSlowSpeed && (
                          <div className="flex items-center gap-2 color-nonary text-xs">
                            <AlertTriangle size={16} />
                            <span>Route maybe congested</span>
                          </div>
                        )}
                        {showTollFeeWarning && (
                           <div className="flex items-center gap-2 color-nonary text-xs">
                            <CircleDollarSign size={16} />
                            <span>price exclude toll fees</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {totalCost !== null && totalCost > 0 &&(
                      <div className="flex flex-row gap-2 mt-3 pt-2 border-t line-quinary">
                        <div className="flex flex-1 w-full items-center">
                          <p className="text-sm font-medium color-tertiary flex items-center gap-2">
                            <span className={`font-semibold color-senary ${route.isPrimary ? 'text-md' : 'text-sm'}`}>
                                {selectedCurrencySymbol} {totalCost.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                          </p>
                        </div>
                        <div className="flex flex-1 w-full">
                         <button
                          type="button"
                          onClick={buttonAction}
                          disabled={isButtonDisabledForThisCard}
                          className={`w-full font-bold text-xs rounded-sm focus:outline-none focus:shadow-outline transition-colors py-2 
                            ${
                              route.isPrimary
                                ? 'background-tertiary hover:bg-yellow-400 color-primary cursor-pointer'
                                : 'background-quaternary color-doctary'
                            } 
                            disabled:cursor-not-allowed disabled:opacity-60`
                          }
                        >
                          {buttonText}
                        </button>
                        </div>
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