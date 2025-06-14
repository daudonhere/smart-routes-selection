import { TransportMode } from './types';
import { LocationInfo, ORSDirectionsResponse, ORSRoute } from './types';

const OPENROUTESERVICE_API_KEY = process.env.NEXT_PUBLIC_ORS_API_KEY;
const OPENROUTESERVICE_BASE_URL = process.env.NEXT_PUBLIC_ORS_BASE_URL;

interface ORSApiOptions {
  avoid_features?: ('tollways' | 'ferries')[];
}

interface ORSAlternativeRoutesOptions {
  target_count: number;
  share_factor: number;
  weight_factor: number;
}

export const fetchOptimalRoutes = async (
  start: LocationInfo,
  end: LocationInfo,
  transportMode: TransportMode,
  avoidTollways: boolean
): Promise<ORSRoute[]> => {
  if (!OPENROUTESERVICE_API_KEY) throw new Error("API Key for routing service is not configured.");

  let profile: string;
  switch (transportMode) {
    case 'motorbike':
      profile = 'cycling-road';
      break;
    case 'car':
      profile = 'driving-car';
      break;
    case 'truck':
      profile = 'driving-hgv';
      break;
    default:
      profile = 'driving-car';
  }
  
  const baseBody = {
    coordinates: [
      [start.coords[1], start.coords[0]],
      [end.coords[1], end.coords[0]],
    ],
    instructions: false,
  };

  const alternativeOptions: ORSAlternativeRoutesOptions = {
    target_count: 2,
    weight_factor: 1.5,
    share_factor: 0.6,
  };

  const options: ORSApiOptions = {};

  if ((transportMode === 'car' || transportMode === 'truck') && avoidTollways) {
    options.avoid_features = ['tollways', 'ferries'];
  }

  const res = await fetch(`${OPENROUTESERVICE_BASE_URL}/v2/directions/${profile}`, {
    method: 'POST',
    headers: {
      Authorization: OPENROUTESERVICE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...baseBody,
      options,
      alternative_routes: alternativeOptions,
    }),
  });

  const data: ORSDirectionsResponse = await res.json();

  if (!res.ok || !data.routes?.length) {
    const errorMessage = data.error?.message || 'Failed to fetch route from ORS';
    if (errorMessage.includes("Point is not found")) {
        throw new Error("Locations cannot be reached or found on the map");
    }
    throw new Error(errorMessage);
  }

  return data.routes;
};