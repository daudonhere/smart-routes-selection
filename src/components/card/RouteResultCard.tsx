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
    if (journeyMessage === 'im finish, thank you') {
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
    <div onClick={isCardClickable ? () => setActiveRoute(route.id) : undefined} 
      className={`p-2 rounded-lg transition-all ${route.isPrimary ? 'background-primary border line-senary shadow-lg shadow-quinary/20' : 'background-tertiary border-2 line-quaternary'} ${isCardClickable ? 'hover:line-doctary cursor-pointer' : ''} ${(!isCardClickable && !route.isPrimary) || isActionLocked ? 'cursor-not-allowed' : ''}`}
    >
      <p className="flex items-center gap-1.5 font-bold color-quinary text-sm lg:text-xs 2xl:text-lg">
        <Info size={12} className={`hidden ${route.isPrimary ? 'color-senary' : 'color-quinary'} lg:block 2xl:hidden`} />
        <Info size={14} className={`block ${route.isPrimary ? 'color-senary' : 'color-quinary'} lg:hidden 2xl:hidden`} />
        <Info size={20} className={`hidden ${route.isPrimary ? 'color-senary' : 'color-quinary'} 2xl:block`} />
        {route.isPrimary ? 'Preferred Route' : 'Alternative Route'}
      </p>
      
      <div className="flex flex-col w-full mt-2.5 gap-1.5 2xl:gap-2">
        <div className="flex flex-row gap-1.5 2xl:gap-2.5">
          <div className='flex flex-row w-full items-center gap-1'>
            <Route size={12} className={`hidden ${route.isPrimary ? 'color-senary' : 'color-quinary'} lg:block 2xl:hidden`} />
            <Route size={14} className={`block ${route.isPrimary ? 'color-senary' : 'color-quinary'} lg:hidden 2xl:hidden`} />
            <Route size={20} className={`hidden ${route.isPrimary ? 'color-senary' : 'color-quinary'} 2xl:block`} />
            <span className="font-bold color-quinary text-xs lg:text-[10px] 2xl:text:base">{route.distance.toFixed(2)} Km</span>
          </div>
          <div className='flex flex-row w-full items-center gap-1'>
            <Gauge size={12} className={`hidden ${route.isPrimary ? 'color-senary' : 'color-quinary'} lg:block 2xl:hidden`} />
            <Gauge size={14} className={`block ${route.isPrimary ? 'color-senary' : 'color-quinary'} lg:hidden 2xl:hidden`} />
            <Gauge size={20} className={`hidden ${route.isPrimary ? 'color-senary' : 'color-quinary'} 2xl:block`} />
            <span className="font-bold color-quinary text-xs lg:text-[10px] 2xl:text:base">
              {`${lowerSpeed.toFixed(0)} - ${upperSpeed.toFixed(0)} Kmh`}
            </span>
          </div>
        </div>
        <div className="flex flex-row gap-1.5 2xl:gap-2">
          <div className='flex flex-row w-full items-center gap-1'>
            <Timer size={12} className={`hidden ${route.isPrimary ? 'color-senary' : 'color-quinary'} lg:block 2xl:hidden`} />
            <Timer size={14} className={`block ${route.isPrimary ? 'color-senary' : 'color-quinary'} lg:hidden 2xl:hidden`} />
            <Timer size={20} className={`hidden ${route.isPrimary ? 'color-senary' : 'color-quinary'} 2xl:block`} />
            <span className="font-bold color-quinary text-xs lg:text-[10px] 2xl:text:base">{route.duration.toFixed(0)} Minutes</span>
          </div>
          <div className='flex flex-row w-full items-center gap-1'>
            <TrafficCone size={12} className={`hidden ${route.isPrimary ? 'color-senary' : 'color-quinary'} lg:block 2xl:hidden`} />
            <TrafficCone size={14} className={`block ${route.isPrimary ? 'color-senary' : 'color-quinary'} lg:hidden 2xl:hidden`} />
            <TrafficCone size={20} className={`hidden ${route.isPrimary ? 'color-senary' : 'color-quinary'} 2xl:block`} />
            <span className="font-bold color-quinary text-xs lg:text-[10px] 2xl:text:base">
            {transportMode === 'motorbike' ? 'Outside Toll' : (route.hasToll ? 'Via Toll' : 'Without Toll')}
            </span>
          </div>
        </div>
        <div className="flex flex-col mt-1 gap-1">
          {isSlowSpeed && (
            <div className="flex items-center gap-2 font-semibold color-senary text-xs lg:text-[10px] 2xl:text:base">
              <AlertTriangle size={12} className="hidden lg:block 2xl:hidden" />
              <AlertTriangle size={14} className="hidden lg:hidden 2xl:hidden" />
              <AlertTriangle size={20} className="hidden 2xl:block" />
              <span>Route maybe congested</span>
            </div>
          )}
          {showTollFeeWarning && (
              <div className="flex items-center gap-2 font-semibold color-senary text-xs lg:text-[10px] 2xl:text:base">
                <CircleDollarSign size={12} className="hidden lg:block 2xl:hidden" />
                <CircleDollarSign size={14} className="hidden lg:hidden 2xl:hidden" />
                <CircleDollarSign size={20} className="hidden 2xl:block" />
                <span>Price exclude toll fees</span>
              </div>
          )}
        </div>
      </div>
      {totalCost !== null && totalCost > 0 &&(
        <div className="flex flex-row mt-2 pt-1.5 border-t line-senary gap-2">
          <div className="flex flex-1 w-full items-center">
            <p className="flex items-center gap-2 font-medium color-senary">
              <span className={`font-bold color-quinary ${route.isPrimary ? 'text-sm lg:text-xs 2xl:text-base' : 'text-xs lg:text-[11px] 2xl:text-sm'}`}>
                  {currencySymbol} {totalCost.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </p>
          </div>
          <div className="flex flex-1 w-full">
            <button
              type="button"
              onClick={buttonAction}
              disabled={isButtonDisabledForThisCard}
              className={`w-full py-2 font-bold rounded-sm transition-colors focus:outline-none focus:shadow-outline text-xs lg:text-[10px] 2xl:text:sm ${route.isPrimary ? 'background-senary hover:bg-yellow-300 color-primary cursor-pointer' : 'background-quaternary color-quinary'} disabled:cursor-not-allowed disabled:opacity-80`}
            >
              {buttonText}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}