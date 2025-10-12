import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

// GET /api/warehouses - List all warehouse locations
export async function GET() {
  try {
    const warehouses = await prisma.warehouse.findMany({
      orderBy: [
        { isDefault: "desc" },
        { name: "asc" },
      ],
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    const formattedWarehouses = warehouses.map((warehouse) => ({
      ...warehouse,
      latitude: Number(warehouse.latitude),
      longitude: Number(warehouse.longitude),
    }));

    return NextResponse.json({
      success: true,
      data: formattedWarehouses,
    });
  } catch (error) {
    console.error("Error fetching warehouses:", error);
    return NextResponse.json(
      { error: "Failed to fetch warehouses" },
      { status: 500 }
    );
  }
}

// POST /api/warehouses - Add new warehouse (admin only)
export async function POST(request: NextRequest) {
  try {
    const { error, session } = await requireAdmin();

    if (error) {
      return error;
    }

    const body = await request.json();
    const { name, address, city, state, zipCode, latitude, longitude, isDefault = false } = body;

    if (!name || !address || !city || !state || !zipCode || !latitude || !longitude) {
      return NextResponse.json(
        { error: "All warehouse fields are required" },
        { status: 400 }
      );
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await prisma.warehouse.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        name,
        address,
        city,
        state,
        zipCode,
        latitude,
        longitude,
        isDefault,
        created_by: session.user.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...warehouse,
        latitude: Number(warehouse.latitude),
        longitude: Number(warehouse.longitude),
      },
    });
  } catch (error) {
    console.error("Error creating warehouse:", error);
    return NextResponse.json(
      { error: "Failed to create warehouse" },
      { status: 500 }
    );
  }
}
