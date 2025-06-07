import { RouteInfo, TransportMode } from '@/stores/routesStore';
import { LocationInfo, ORSDirectionsResponse, ORSDirectionsFeature } from './types';

const OPENROUTESERVICE_API_KEY = process.env.NEXT_PUBLIC_ORS_API_KEY;

interface ORSApiOptions {
  avoid_features?: ('tollways' | 'ferries')[];
}

interface ORSAlternativeRoutesOptions {
  target_count: number;
  share_factor: number;
  weight_factor: number;
}

const processFeatures = (features: ORSDirectionsFeature[], transportMode: TransportMode): RouteInfo[] => {
    return features.map((feature, index) => {
        const { summary, segments } = feature.properties;
        const distanceKm = summary.distance / 1000;
        const durationMinutes = summary.duration / 60;

        let hasToll = false;
        if (transportMode === 'car') {
            // PERBAIKAN 2: Tambahkan optional chaining (?.) agar lebih aman jika 'segments' atau 'steps' tidak ada.
            hasToll = segments?.some(seg => seg.steps?.some(step => step.toll)) ?? false;
        }

        return {
            id: `route-${Date.now()}-${index}`,
            coordinates: feature.geometry.coordinates.map((c): [number, number] => [c[1], c[0]]),
            distance: distanceKm,
            duration: durationMinutes,
            isPrimary: index === 0,
            hasToll: hasToll,
        };
    });
};


export const fetchOptimalRoutes = async (start: LocationInfo, end: LocationInfo, transportMode: TransportMode): Promise<RouteInfo[]> => {
    if (!OPENROUTESERVICE_API_KEY) throw new Error("API Key for routing service is not configured.");

    const profile = 'driving-car';

    const baseBody = {
        coordinates: [
            [start.coords[1], start.coords[0]],
            [end.coords[1], end.coords[0]],
        ],
        // PERBAIKAN 1: Ubah 'false' menjadi 'true' untuk mendapatkan detail rute (termasuk info tol).
        instructions: true,
    };

    const apiCall = async (options?: ORSApiOptions, alternative_routes?: ORSAlternativeRoutesOptions): Promise<ORSDirectionsResponse> => {
        const body = { ...baseBody, ...(options && { options }), ...(alternative_routes && { alternative_routes }) };

        const res = await fetch(`https://api.openrouteservice.org/v2/directions/${profile}/geojson`, {
            method: 'POST',
            headers: { 'Authorization': OPENROUTESERVICE_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data: ORSDirectionsResponse = await res.json();
        if (!res.ok) {
            throw new Error(data.error?.message || 'Failed to fetch routes from the service.');
        }
        return data;
    };
    
    const alternativeOptions = {
        target_count: 2,
        weight_factor: 2.0,
        share_factor: 0.5
    };

    let modeSpecificOptions: ORSApiOptions | undefined;
    if (transportMode === 'motorbike') {
        modeSpecificOptions = { avoid_features: ["tollways", "ferries"] };
    }

    const response = await apiCall(modeSpecificOptions, alternativeOptions);

    if (!response.features || response.features.length === 0) {
        throw new Error(`Tidak ada rute yang ditemukan untuk mode ${transportMode}.`);
    }
    
    return processFeatures(response.features, transportMode);
};