// libs/types.ts

// Tipe untuk Respons Geocoding dari OpenRouteService
export interface ORSGeocodeFeature {
  geometry: {
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    label: string;
  };
}

export interface ORSGeocodeResponse {
  features: ORSGeocodeFeature[];
}

// Tipe untuk Respons Rute/Arah dari OpenRouteService
export interface ORSStep {
  toll: boolean;
  name: string;
  // Properti lain yang mungkin Anda butuhkan
}

export interface ORSSegment {
  steps: ORSStep[];
  // Properti lain yang mungkin Anda butuhkan
}

export interface ORSSummary {
  distance: number; // dalam meter
  duration: number; // dalam detik
}

export interface ORSDirectionsFeature {
  geometry: {
    coordinates: [number, number][]; // Array dari [longitude, latitude]
  };
  properties: {
    summary: ORSSummary;
    segments: ORSSegment[];
  };
}

export interface ORSError {
  message: string;
  details?: Record<string, unknown> | string;
}

export interface ORSDirectionsResponse {
  features: ORSDirectionsFeature[];
  error?: ORSError;
}

// Tipe internal aplikasi
export interface LocationInfo {
  coords: [number, number]; // [latitude, longitude]
  name: string;
}