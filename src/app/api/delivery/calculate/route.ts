import { NextRequest, NextResponse } from "next/server";
import { calculateRoute } from "@/lib/route-calculator";
import { calculateDeliveryCost, validatePricing, getPricingFromEnv } from "@/lib/delivery-pricing";
import type { Coordinates } from "@/types/location";

export const runtime = 'nodejs';

// POST /api/delivery/calculate - Calculate delivery route and cost
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origin, destination, pricing } = body;

    if (!origin || !destination) {
      return NextResponse.json(
        { error: "Origin and destination coordinates are required" },
        { status: 400 }
      );
    }

    const { latitude: originLat, longitude: originLon } = origin as Coordinates;
    const { latitude: destLat, longitude: destLon } = destination as Coordinates;

    if (!originLat || !originLon || !destLat || !destLon) {
      return NextResponse.json(
        { error: "Invalid coordinates" },
        { status: 400 }
      );
    }

    // Calculate route
    const route = await calculateRoute(
      { latitude: originLat, longitude: originLon },
      { latitude: destLat, longitude: destLon }
    );

    if (!route) {
      return NextResponse.json(
        { error: "Could not calculate route" },
        { status: 500 }
      );
    }

    // Validate and get pricing configuration
    let validPricing = pricing;
    if (!pricing || !validatePricing(pricing)) {
      console.warn('Invalid pricing provided, using default pricing from environment');
      validPricing = getPricingFromEnv();
    }

    // Calculate delivery cost
    const deliveryCalculation = calculateDeliveryCost(route.distance, validPricing);

    return NextResponse.json({
      success: true,
      data: {
        route: {
          distance: route.distance,
          duration: route.duration,
          geometry: route.geometry,
        },
        delivery: {
          ...deliveryCalculation,
          route: route,
        },
      },
    });
  } catch (error) {
    console.error("Delivery calculation API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
