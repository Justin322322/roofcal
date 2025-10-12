/**
 * Location-related TypeScript interfaces and types
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  fullAddress?: string;
}

export interface GeocodedAddress extends Address {
  coordinates: Coordinates;
  formattedAddress: string;
  confidence?: number;
}

export interface Route {
  distance: number; // in miles
  duration: number; // in minutes
  geometry: string; // encoded polyline
  waypoints?: Coordinates[];
}

export interface Warehouse {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface DeliveryPricing {
  tier1: {
    maxDistance: number; // miles
    flatFee: number; // pesos
  };
  tier2: {
    maxDistance: number; // miles
    flatFee: number; // pesos
    perMileRate: number; // pesos per mile
  };
  tier3: {
    perMileRate: number; // pesos per mile
  };
}

export interface DeliveryCalculation {
  distance: number;
  duration: number;
  cost: number;
  pricingBreakdown: {
    tier: 1 | 2 | 3;
    baseCost: number;
    mileageCost: number;
    totalCost: number;
  };
  route?: Route;
}

export interface DeliverySettings {
  pricing: DeliveryPricing;
  defaultWarehouseId?: string;
  enableDeliveryCost: boolean;
}
