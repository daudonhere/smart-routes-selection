export type TransportMode = 'motorbike' | 'car' | 'truck';
export interface Driver {
  id: string;
  type: TransportMode;
  position: [number, number];
}
export type DriverDirection = 'front' | 'back' | 'left' | 'right';
export interface ORSStep {
  toll?: boolean | string | Record<string, unknown>;
}
export interface ORSSegment {
  steps: ORSStep[];
}
interface ORSWaytypeSummary {
  value: number;
  distance: number;
  amount: number;
}
interface ORSExtras {
  waytypes?: {
    summary: ORSWaytypeSummary[];
  };
}
export interface ORSSummary {
  distance: number;
  duration: number;
}
export interface ORSRoute {
  summary: ORSSummary;
  geometry: string;
  segments: ORSSegment[];
  extras?: ORSExtras;
}
export interface ORSDirectionsResponse {
  routes: ORSRoute[];
  error?: {
    message: string;
  };
}
export interface ORSGeocodeFeature {
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    label: string;
  };
}
export interface ORSGeocodeResponse {
  features: ORSGeocodeFeature[];
}
export interface LocationInfo {
  coords: [number, number];
  name: string;
}
export interface RouteInfo {
  id: string;
  coordinates: [number, number][];
  distance: number;
  duration: number;
  isPrimary: boolean;
  hasToll: boolean;
  averageSpeed: number;
}