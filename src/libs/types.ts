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

export type TransportMode = 'motorbike' | 'car' | 'truck';
export type DriverDirection = 'front' | 'back' | 'left' | 'right';

export interface LocationInfo { coords: [number, number]; name: string; }
export interface RouteInfo { id: string; coordinates: [number, number][]; distance: number; duration: number; isPrimary: boolean; hasToll: boolean; averageSpeed: number; }
export interface Driver { id: string; type: TransportMode; position: [number, number]; }

export interface RouteSlice {
  departurePoint: [number, number] | null;
  destinationPoint: [number, number] | null;
  departureAddress: string;
  destinationAddress: string;
  transportMode: TransportMode;
  routes: RouteInfo[];
  includeTolls: boolean;
  setTransportMode: (mode: TransportMode) => void;
  setIncludeTolls: (include: boolean) => void;
  setDepartureFromInput: (address: string) => void;
  setDestinationFromInput: (address: string) => void;
  setPoint: (type: 'departure' | 'destination', locationInfo: LocationInfo) => void;
  setActiveRoute: (routeId: string) => void;
  fetchRoutes: () => Promise<void>;
}

export interface SimulationSlice {
  isOffering: boolean;
  nearbyDrivers: Driver[];
  acceptingDriver: Driver | null;
  pickupRoute: RouteInfo | null;
  isDriverEnroute: boolean;
  driverPosition: [number, number] | null;
  driverDirection: DriverDirection;
  hasDriverArrived: boolean;
  startOfferSimulation: () => void;
  cancelOffer: () => void;
  _startDriverAnimation: () => void;
}

export interface UiSlice {
  userLocation: [number, number] | null;
  isRouteLoading: boolean;
  isMapLoading: boolean;
  error: string | null;
  initializeLocation: () => void;
  updateLocationFromMap: (latlng: L.LatLng, type: 'departure' | 'destination') => Promise<void>;
  clearError: () => void;
}

export type AppState = RouteSlice & SimulationSlice & UiSlice;