"use client";

import { useRouteStore } from "@/stores/routesStore";
import { RouteInfo } from "@/libs/types";
import { Info, Route, Gauge, Timer, TrafficCone, AlertTriangle, CircleDollarSign } from 'lucide-react';

interface RouteResultCardProps {
  route: RouteInfo;
  totalCost: number | null;
  currencySymbol: string;
}

export default function RouteResultCard({ route, totalCost, currencySymbol }: RouteResultCardProps) {
  const transportMode = useRouteStore((state) => state.transportMode);
  const setActiveRoute = useRouteStore((state) => state.setActiveRoute);
  const isOffering = useRouteStore((state) => state.isOffering);
  const startOfferSimulation = useRouteStore((state) => state.startOfferSimulation);
  const acceptingDriver = useRouteStore((state) => state.acceptingDriver);
  const cancelOffer = useRouteStore((state) => state.cancelOffer);
  const isDriverEnroute = useRouteStore((state) => state.isDriverEnroute);
  const hasDriverArrived = useRouteStore((state) => state.hasDriverArrived);
  const isJourneyInProgress = useRouteStore((state) => state.isJourneyInProgress);
  const journeyMessage = useRouteStore((state) => state.journeyMessage);
  const isActionLocked = useRouteStore((state) => state.isActionLocked);
  const isSlowSpeed = route.averageSpeed < 30;
  const showTollFeeWarning = (transportMode === 'car' || transportMode === 'truck') && route.hasToll;
  const lowerSpeed = route.averageSpeed;
  const upperSpeed = lowerSpeed + 10;
  const hasDriver = !!acceptingDriver;
  const isCardClickable = !route.isPrimary && !isActionLocked;

  let buttonText = 'Make An Offer';
  let buttonAction = () => {};
  let isButtonDisabledForThisCard = true;

  if (route.isPrimary) {
    if (journeyMessage === 'Im finish, thank you') {
      buttonText = 'Finished';
      isButtonDisabledForThisCard = true;
    } else if (isJourneyInProgress) {
      buttonText = 'On The Way';
      isButtonDisabledForThisCard = true;
    } else if (hasDriverArrived) {
      buttonText = 'Driver Arrived';
      isButtonDisabledForThisCard = true;
    } else if (isDriverEnroute) {
      buttonText = 'On The Way';
      isButtonDisabledForThisCard = true;
    } else if (hasDriver) { 
      buttonText = 'Cancel';
      buttonAction = cancelOffer;
      isButtonDisabledForThisCard = false;
    } else if (isOffering) {
      buttonText = 'Searching...';
      isButtonDisabledForThisCard = true;
    } else {
      buttonText = 'Make An Offer';
      buttonAction = startOfferSimulation;
      isButtonDisabledForThisCard = false;
    }
  } else {
    buttonText = 'Make An Offer';
    isButtonDisabledForThisCard = true;
  }
  
  if (isActionLocked && buttonAction !== cancelOffer) {
    isButtonDisabledForThisCard = true;
  }
  
  return (
    <div 
      onClick={isCardClickable ? () => setActiveRoute(route.id) : undefined} 
      className={`p-3 rounded-lg transition-all ${route.isPrimary ? 'background-primary border line-senary shadow-lg shadow-quinary/20' : 'background-tertiary border-2 line-quaternary'} ${isCardClickable ? 'hover:line-doctary cursor-pointer' : ''} ${(!isCardClickable && !route.isPrimary) || isActionLocked ? 'cursor-not-allowed' : ''}`}
    >
      <p className="font-bold color-quinary flex items-center gap-2">
        <Info size={16} className={route.isPrimary ? 'color-senary' : 'color-quinary'} />
        {route.isPrimary ? 'Preferred Route' : 'Alternative Route'}
      </p>
      <div className="flex flex-col gap-2 w-full mt-1">
        <div className="flex flex-row gap-6">
          <div className='flex flex-row gap-1 w-full items-center'>
            <Route size={16} className={route.isPrimary ? 'color-senary' : 'color-quinary'} />
            <span className="font-bold text-xs color-quinary">{route.distance.toFixed(2)} Km</span>
          </div>
          <div className='flex flex-row gap-1 w-full items-center'>
            <Gauge size={16} className={route.isPrimary ? 'color-senary' : 'color-quinary'} />
            <span className="font-bold text-xs color-quinary">
              {`${lowerSpeed.toFixed(0)} - ${upperSpeed.toFixed(0)} Kmh`}
            </span>
          </div>
        </div>
        <div className="flex flex-row gap-6">
          <div className='flex flex-row gap-1 w-full items-center'>
            <Timer size={16} className={route.isPrimary ? 'color-senary' : 'color-quinary'} />
            <span className="font-bold text-xs color-quinary">{route.duration.toFixed(0)} Minutes</span>
          </div>
          <div className='flex flex-row gap-1 w-full items-center'>
            <TrafficCone size={16} className={route.isPrimary ? 'color-senary' : 'color-quinary'} />
            <span className="font-bold text-xs color-quinary">
            {transportMode === 'motorbike' ? 'Outside Toll' : (route.hasToll ? 'Via Toll' : 'Without Toll')}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1 mt-1">
          {isSlowSpeed && (
            <div className="flex items-center gap-2 color-senary text-xs font-semibold"><AlertTriangle size={16} /><span>Route maybe congested</span></div>
          )}
          {showTollFeeWarning && (
              <div className="flex items-center gap-2 color-senary text-xs font-semibold"><CircleDollarSign size={16} /><span>Price exclude toll fees</span></div>
          )}
        </div>
      </div>
      {totalCost !== null && totalCost > 0 &&(
        <div className="flex flex-row gap-2 mt-3 pt-2 border-t line-senary">
          <div className="flex flex-1 w-full items-center">
            <p className="text-sm font-medium color-senary flex items-center gap-2">
              <span className={`font-bold color-quinary ${route.isPrimary ? 'text-md' : 'text-sm'}`}>
                  {currencySymbol} {totalCost.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </p>
          </div>
          <div className="flex flex-1 w-full">
            <button
              type="button"
              onClick={buttonAction}
              disabled={isButtonDisabledForThisCard}
              className={`w-full font-bold text-xs rounded-sm focus:outline-none focus:shadow-outline transition-colors py-2 ${route.isPrimary ? 'background-senary hover:bg-yellow-300 color-primary cursor-pointer' : 'background-quaternary color-quinary'} disabled:cursor-not-allowed disabled:opacity-70`}
            >
              {buttonText}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}