/**
 * Geocoding service using OpenStreetMap Nominatim API
 */

import type { GeocodedAddress, Coordinates } from '@/types/location';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

export interface NominatimResponse {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    municipality?: string;
    town?: string;
    state?: string;
    province?: string;
    postcode?: string;
    country?: string;
  };
  confidence?: number;
}

export interface GeocodeOptions {
  country?: string;
  limit?: number;
  addressdetails?: boolean;
}

/**
 * Geocode an address to get coordinates
 */
export async function geocodeAddress(
  address: string,
  options: GeocodeOptions = {}
): Promise<GeocodedAddress | null> {
  try {
    const params = new URLSearchParams({
      q: address,
      format: 'json',
      limit: '1',
      addressdetails: '1',
      countrycodes: options.country || 'ph',
    });
    
    // Add optional parameters
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.addressdetails !== undefined) params.set('addressdetails', options.addressdetails.toString());

    const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, {
      headers: {
        'User-Agent': 'RoofCalc/1.0 (contact@example.com)', // Required by Nominatim
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }

    const data: NominatimResponse[] = await response.json();

    if (!data || data.length === 0) {
      return null;
    }

    const result = data[0];
    const coords: Coordinates = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    };

    // Parse address components (Philippine format)
    const street = result.address?.road || '';
    const city = result.address?.city || result.address?.municipality || result.address?.town || '';
    const state = result.address?.state || result.address?.province || '';
    const zipCode = result.address?.postcode || '';

    return {
      street,
      city,
      state,
      zipCode,
      fullAddress: address,
      coordinates: coords,
      formattedAddress: result.display_name,
      confidence: result.confidence,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Reverse geocode coordinates to get address
 */
export async function reverseGeocode(coordinates: Coordinates): Promise<GeocodedAddress | null> {
  try {
    const params = new URLSearchParams({
      lat: coordinates.latitude.toString(),
      lon: coordinates.longitude.toString(),
      format: 'json',
      addressdetails: '1',
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params}`, {
      headers: {
        'User-Agent': 'RoofCalc/1.0 (contact@example.com)',
      },
    });

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.statusText}`);
    }

    const result: NominatimResponse = await response.json();

    if (!result) {
      return null;
    }

    const coords: Coordinates = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    };

    // Parse address components (Philippine format)
    const street = result.address?.road || '';
    const city = result.address?.city || result.address?.municipality || result.address?.town || '';
    const state = result.address?.state || result.address?.province || '';
    const zipCode = result.address?.postcode || '';

    return {
      street,
      city,
      state,
      zipCode,
      coordinates: coords,
      formattedAddress: result.display_name,
      confidence: result.confidence,
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

/**
 * Format address string from components
 */
export function formatAddress(address: {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}): string {
  const parts = [address.street, address.city, address.state, address.zipCode];
  return parts.filter(Boolean).join(', ');
}

/**
 * Validate coordinates
 */
export function isValidCoordinates(coordinates: Coordinates): boolean {
  return (
    coordinates.latitude >= -90 &&
    coordinates.latitude <= 90 &&
    coordinates.longitude >= -180 &&
    coordinates.longitude <= 180
  );
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
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
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
