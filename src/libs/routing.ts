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

  const profile = transportMode === 'motorbike' ? 'cycling-regular' : 'driving-car';

  const baseBody = {
    coordinates: [
      [start.coords[1], start.coords[0]],
      [end.coords[1], end.coords[0]],
    ],
    instructions: false,
  };

  const alternativeOptions: ORSAlternativeRoutesOptions = {
    target_count: 3,
    weight_factor: 1.5,
    share_factor: 0.6,
  };

  const options: ORSApiOptions = {};

  if (transportMode === 'car' && avoidTollways) {
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
    const errorMessage = data.error?.message || 'Gagal mengambil rute dari OpenRouteService.';
    if (errorMessage.includes("point is not found")) {
      throw new Error("Satu atau kedua lokasi tidak dapat dijangkau atau ditemukan di peta.");
    }
    throw new Error(errorMessage);
  }
  return data.routes;
};