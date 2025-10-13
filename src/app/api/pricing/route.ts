import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { UserRole } from "@/types/user-role";
import {
  getPricingConfig,
  getPricingConstants,
  createPricingConfig,
  CreatePricingConfigSchema,
  type PricingCategory,
} from "@/lib/pricing";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as PricingCategory | null;
    const constants = searchParams.get("constants");

    // Handle pricing constants request
    if (constants === "true") {
      const pricingConstants = await getPricingConstants();
      return NextResponse.json({
        success: true,
        data: pricingConstants,
      });
    }

    // Validate category if provided
    if (category && !["materials", "gutters", "ridges", "screws", "screw_types", "insulation", "ventilation", "labor"].includes(category)) {
      return NextResponse.json(
        { error: "Invalid category parameter" },
        { status: 400 }
      );
    }

    const pricingconfig = await getPricingConfig(category || undefined);

    return NextResponse.json({
      success: true,
      data: pricingconfig,
    });
  } catch (error) {
    console.error("Error fetching pricing config:", error);
    return NextResponse.json(
      { error: "Failed to fetch pricing configuration" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check admin role
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validatedData = CreatePricingConfigSchema.parse(body);

    const pricingconfig = await createPricingConfig(validatedData);

    return NextResponse.json({
      success: true,
      data: pricingconfig,
      message: "Pricing configuration created successfully",
    });
  } catch (error) {
    console.error("Error creating pricing config:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: error.issues 
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create pricing configuration" },
      { status: 500 }
    );
  }
}
