/**
 * Route calculator service using OpenRouteService API
 */

import type { Coordinates, Route } from '@/types/location';

const ORS_BASE_URL = 'https://api.openrouteservice.org/v2';

export interface ORSRouteResponse {
  features: Array<{
    properties: {
      summary: {
        distance: number; // in meters
        duration: number; // in seconds
      };
    };
    geometry: {
      coordinates: number[][];
    };
  }>;
}

export interface RouteOptions {
  profile?: 'driving-car' | 'driving-hgv' | 'foot-walking' | 'cycling-regular';
  alternatives?: boolean;
  geometries?: 'polyline' | 'geojson';
  format?: 'json' | 'geojson';
}

/**
 * Calculate route between two coordinates
 */
export async function calculateRoute(
  start: Coordinates,
  end: Coordinates,
  options: RouteOptions = {}
): Promise<Route | null> {
  try {
    const apiKey = process.env.OPENROUTESERVICE_API_KEY;
    
    if (!apiKey) {
      console.warn('OpenRouteService API key not found, using fallback calculation');
      return calculateFallbackRoute(start, end);
    }

    const body = {
      coordinates: [
        [start.longitude, start.latitude],
        [end.longitude, end.latitude],
      ],
      profile: options.profile || 'driving-car',
      format: options.format || 'json',
      geometries: options.geometries || 'polyline',
      instructions: false,
    };

    const response = await fetch(`${ORS_BASE_URL}/directions/${body.profile}/json`, {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Route calculation failed: ${response.statusText}`);
    }

    const data: ORSRouteResponse = await response.json();

    if (!data.features || data.features.length === 0) {
      return calculateFallbackRoute(start, end);
    }

    const feature = data.features[0];
    const distance = feature.properties.summary.distance / 1609.34; // Convert meters to miles
    const duration = feature.properties.summary.duration / 60; // Convert seconds to minutes

    return {
      distance: Math.round(distance * 100) / 100,
      duration: Math.round(duration),
      geometry: options.geometries === 'geojson' 
        ? JSON.stringify(feature.geometry)
        : encodePolyline(feature.geometry.coordinates),
      waypoints: [start, end],
    };
  } catch (error) {
    console.error('Route calculation error:', error);
    return calculateFallbackRoute(start, end);
  }
}

/**
 * Fallback route calculation using straight-line distance
 */
function calculateFallbackRoute(start: Coordinates, end: Coordinates): Route {
  const distance = calculateStraightLineDistance(start, end);
  const duration = distance * 2; // Rough estimate: 30 mph average
  
  return {
    distance: Math.round(distance * 100) / 100,
    duration: Math.round(duration),
    geometry: '',
    waypoints: [start, end],
  };
}

/**
 * Calculate straight-line distance between two coordinates
 */
function calculateStraightLineDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.latitude)) *
      Math.cos(toRadians(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Simple polyline encoding (for basic route visualization)
 */
function encodePolyline(coordinates: number[][]): string {
  // This is a simplified implementation
  // For production, consider using a proper polyline encoding library
  return JSON.stringify(coordinates);
}

/**
 * Find the nearest warehouse to a given location
 */
export async function findNearestWarehouse(
  location: Coordinates,
  warehouses: Array<{ id: string; latitude: number; longitude: number }>
): Promise<string | null> {
  if (!warehouses || warehouses.length === 0) {
    return null;
  }

  let nearestWarehouse = warehouses[0];
  let shortestDistance = calculateStraightLineDistance(
    location,
    { latitude: warehouses[0].latitude, longitude: warehouses[0].longitude }
  );

  for (let i = 1; i < warehouses.length; i++) {
    const distance = calculateStraightLineDistance(
      location,
      { latitude: warehouses[i].latitude, longitude: warehouses[i].longitude }
    );

    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearestWarehouse = warehouses[i];
    }
  }

  return nearestWarehouse.id;
}

/**
 * Calculate multiple routes (for route optimization)
 */
export async function calculateMultipleRoutes(
  start: Coordinates,
  destinations: Coordinates[],
  options: RouteOptions = {}
): Promise<Route[]> {
  const routes: Route[] = [];

  for (const destination of destinations) {
    const route = await calculateRoute(start, destination, options);
    if (route) {
      routes.push(route);
    }
  }

  return routes.sort((a, b) => a.distance - b.distance);
}
