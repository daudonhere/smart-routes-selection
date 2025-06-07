// libs/geocoding.ts
import { ORSGeocodeResponse, LocationInfo } from './types';

const OPENROUTESERVICE_API_KEY = process.env.NEXT_PUBLIC_ORS_API_KEY;

export const fetchAddressName = async (coords: [number, number]): Promise<string> => {
  const fallbackAddress = `${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}`;
  if (!OPENROUTESERVICE_API_KEY) return fallbackAddress;

  try {
    const response = await fetch(`https://api.openrouteservice.org/geocode/reverse?api_key=${OPENROUTESERVICE_API_KEY}&point.lon=${coords[1]}&point.lat=${coords[0]}&size=1`);
    if (!response.ok) return fallbackAddress;
    
    const data: ORSGeocodeResponse = await response.json();
    return data.features?.[0]?.properties?.label || fallbackAddress;
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return fallbackAddress;
  }
};

export const resolveLocationToInfo = async (locationInput: string): Promise<LocationInfo | null> => {
  if (!OPENROUTESERVICE_API_KEY) return null;

  try {
    const response = await fetch(`https://api.openrouteservice.org/geocode/search?api_key=${OPENROUTESERVICE_API_KEY}&text=${encodeURIComponent(locationInput)}&boundary.country=ID&size=1`);
    if (!response.ok) throw new Error('Geocoding search failed.');

    const data: ORSGeocodeResponse = await response.json();
    if (data.features?.length > 0) {
      const feature = data.features[0];
      const [lon, lat] = feature.geometry.coordinates;
      return { coords: [lat, lon], name: feature.properties.label };
    }
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};