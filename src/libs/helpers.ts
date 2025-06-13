import { ORSRoute, TransportMode, RouteInfo } from "@/libs/types";
import polyline from '@mapbox/polyline';

const MOTORBIKE_SPEED_ADJUSTMENT = 17;
const CAR_TOLL_SPEED_ADJUSTMENT = 15;
const CAR_NON_TOLL_SPEED_ADJUSTMENT = -30;
const TRUCK_TOLL_SPEED_ADJUSTMENT = 10;
const TRUCK_NON_TOLL_SPEED_ADJUSTMENT = -15;

export const processRawRouteToInfo = (
  rawRoute: ORSRoute,
  transportMode: TransportMode,
  hasToll: boolean
): Omit<RouteInfo, 'id' | 'isPrimary'> => {
  const { summary, geometry } = rawRoute;
  const distanceKm = summary.distance / 1000;
  const decodedCoordinates = polyline.decode(geometry) as [number, number][];
  const orsDurationMinutes = summary.duration / 60;

  const orsAverageSpeed = distanceKm > 0 ? distanceKm / (orsDurationMinutes / 60) : 0;
  let adjustedAverageSpeed = orsAverageSpeed;

  switch (transportMode) {
    case 'motorbike': adjustedAverageSpeed += MOTORBIKE_SPEED_ADJUSTMENT; break;
    case 'car': adjustedAverageSpeed += hasToll ? CAR_TOLL_SPEED_ADJUSTMENT : CAR_NON_TOLL_SPEED_ADJUSTMENT; break;
    case 'truck': adjustedAverageSpeed += hasToll ? TRUCK_TOLL_SPEED_ADJUSTMENT : TRUCK_NON_TOLL_SPEED_ADJUSTMENT; break;
  }
  if (adjustedAverageSpeed < 5) adjustedAverageSpeed = 5;
  const finalDurationMinutes = (distanceKm / adjustedAverageSpeed) * 60;

  return { coordinates: decodedCoordinates, distance: distanceKm, duration: finalDurationMinutes, hasToll, averageSpeed: adjustedAverageSpeed };
};