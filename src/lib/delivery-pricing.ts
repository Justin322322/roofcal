/**
 * Delivery pricing service with tiered pricing logic
 */

import type { DeliveryPricing, DeliveryCalculation } from '@/types/location';

// Default pricing tiers
const DEFAULT_PRICING: DeliveryPricing = {
  tier1: {
    maxDistance: 10,
    flatFee: 50,
  },
  tier2: {
    maxDistance: 30,
    flatFee: 50,
    perMileRate: 3,
  },
  tier3: {
    perMileRate: 4,
  },
};

/**
 * Calculate delivery cost based on distance and pricing tiers
 */
export function calculateDeliveryCost(
  distance: number,
  pricing: DeliveryPricing = DEFAULT_PRICING
): DeliveryCalculation {
  let tier: 1 | 2 | 3;
  let baseCost: number;
  let mileageCost: number;
  let totalCost: number;

  if (distance <= pricing.tier1.maxDistance) {
    // Tier 1: Flat fee for short distances
    tier = 1;
    baseCost = pricing.tier1.flatFee;
    mileageCost = 0;
    totalCost = baseCost;
  } else if (distance <= pricing.tier2.maxDistance) {
    // Tier 2: Flat fee + per mile rate for medium distances
    tier = 2;
    baseCost = pricing.tier2.flatFee;
    const milesOverTier1 = distance - pricing.tier1.maxDistance;
    mileageCost = milesOverTier1 * pricing.tier2.perMileRate;
    totalCost = baseCost + mileageCost;
  } else {
    // Tier 3: Higher per mile rate for long distances
    tier = 3;
    baseCost = pricing.tier2.flatFee;
    const milesInTier2 = pricing.tier2.maxDistance - pricing.tier1.maxDistance;
    const milesInTier3 = distance - pricing.tier2.maxDistance;
    const tier2MileageCost = milesInTier2 * pricing.tier2.perMileRate;
    const tier3MileageCost = milesInTier3 * pricing.tier3.perMileRate;
    mileageCost = tier2MileageCost + tier3MileageCost;
    totalCost = baseCost + mileageCost;
  }

  return {
    distance: Math.round(distance * 100) / 100,
    duration: 0, // Will be calculated by route service
    cost: Math.round(totalCost * 100) / 100,
    pricingBreakdown: {
      tier,
      baseCost: Math.round(baseCost * 100) / 100,
      mileageCost: Math.round(mileageCost * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
    },
  };
}

/**
 * Get pricing tiers from environment or return default
 */
export function getPricingFromEnv(): DeliveryPricing {
  try {
    const envPricing = process.env.DELIVERY_PRICING;
    if (envPricing) {
      return JSON.parse(envPricing);
    }
  } catch {
    console.warn('Invalid DELIVERY_PRICING environment variable, using defaults');
  }

  return DEFAULT_PRICING;
}

/**
 * Validate pricing configuration
 */
export function validatePricing(pricing: DeliveryPricing): boolean {
  try {
    // Check required fields
    if (!pricing.tier1 || !pricing.tier2 || !pricing.tier3) {
      return false;
    }

    // Check tier1
    if (
      typeof pricing.tier1.maxDistance !== 'number' ||
      typeof pricing.tier1.flatFee !== 'number' ||
      pricing.tier1.maxDistance <= 0 ||
      pricing.tier1.flatFee < 0
    ) {
      return false;
    }

    // Check tier2
    if (
      typeof pricing.tier2.maxDistance !== 'number' ||
      typeof pricing.tier2.flatFee !== 'number' ||
      typeof pricing.tier2.perMileRate !== 'number' ||
      pricing.tier2.maxDistance <= pricing.tier1.maxDistance ||
      pricing.tier2.flatFee < 0 ||
      pricing.tier2.perMileRate < 0
    ) {
      return false;
    }

    // Check tier3
    if (
      typeof pricing.tier3.perMileRate !== 'number' ||
      pricing.tier3.perMileRate < 0
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Format pricing breakdown for display
 */
export function formatPricingBreakdown(calculation: DeliveryCalculation): string {
  const { pricingBreakdown } = calculation;
  
  let breakdown = `Tier ${pricingBreakdown.tier}: `;
  
  if (pricingBreakdown.tier === 1) {
    breakdown += `$${pricingBreakdown.baseCost} flat fee`;
  } else if (pricingBreakdown.tier === 2) {
    breakdown += `$${pricingBreakdown.baseCost} base + $${pricingBreakdown.mileageCost} mileage`;
  } else {
    breakdown += `$${pricingBreakdown.baseCost} base + $${pricingBreakdown.mileageCost} mileage`;
  }
  
  return breakdown;
}

/**
 * Get pricing tiers description
 */
export function getPricingDescription(pricing: DeliveryPricing = DEFAULT_PRICING): string {
  return `Tier 1 (0-${pricing.tier1.maxDistance} mi): $${pricing.tier1.flatFee} flat fee
Tier 2 (${pricing.tier1.maxDistance}-${pricing.tier2.maxDistance} mi): $${pricing.tier2.flatFee} + $${pricing.tier2.perMileRate}/mi
Tier 3 (${pricing.tier2.maxDistance}+ mi): $${pricing.tier2.flatFee} + $${pricing.tier3.perMileRate}/mi`;
}

/**
 * Calculate delivery cost for multiple distances
 */
export function calculateBulkDeliveryCosts(
  distances: number[],
  pricing: DeliveryPricing = DEFAULT_PRICING
): DeliveryCalculation[] {
  return distances.map(distance => calculateDeliveryCost(distance, pricing));
}

/**
 * Find optimal delivery route for multiple stops
 */
export function optimizeDeliveryRoute(
  start: { latitude: number; longitude: number },
  stops: Array<{ latitude: number; longitude: number }>
): Array<{ latitude: number; longitude: number }> {
  // Simple nearest neighbor algorithm for route optimization
  if (stops.length === 0) return [];
  
  const remaining = [...stops];
  const route = [start];
  let current = start;
  
  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = calculateDistance(current, remaining[0]);
    
    for (let i = 1; i < remaining.length; i++) {
      const distance = calculateDistance(current, remaining[i]);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }
    
    const nearest = remaining.splice(nearestIndex, 1)[0];
    route.push(nearest);
    current = nearest;
  }
  
  return route;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(
  coord1: { latitude: number; longitude: number },
  coord2: { latitude: number; longitude: number }
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
  
  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
