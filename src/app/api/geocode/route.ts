import { NextRequest, NextResponse } from "next/server";
import { geocodeAddress, reverseGeocode } from "@/lib/geocoding";
import type { Coordinates } from "@/types/location";

// POST /api/geocode - Geocode an address to coordinates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, coordinates, country = "us" } = body;

    if (!address && !coordinates) {
      return NextResponse.json(
        { error: "Address or coordinates required" },
        { status: 400 }
      );
    }

    if (address) {
      // Forward geocoding: address -> coordinates
      const result = await geocodeAddress(address, { country });
      
      if (!result) {
        return NextResponse.json(
          { error: "Address not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    if (coordinates) {
      // Reverse geocoding: coordinates -> address
      const { latitude, longitude } = coordinates as Coordinates;
      
      if (!latitude || !longitude) {
        return NextResponse.json(
          { error: "Invalid coordinates" },
          { status: 400 }
        );
      }

      const result = await reverseGeocode({ latitude, longitude });
      
      if (!result) {
        return NextResponse.json(
          { error: "Location not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Geocoding API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
