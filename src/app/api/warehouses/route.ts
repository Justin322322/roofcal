import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/types/user-role";

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
      length: warehouse.length ? Number(warehouse.length) : null,
      width: warehouse.width ? Number(warehouse.width) : null,
      height: warehouse.height ? Number(warehouse.height) : null,
      capacity: warehouse.capacity ? Number(warehouse.capacity) : null,
    }));

    console.log('Warehouses GET response data:', formattedWarehouses);

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

// POST /api/warehouses - Add new warehouse (admin and contractors)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Allow both ADMIN and contractors to create warehouses
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.CLIENT) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, address, city, state, zipCode, latitude, longitude, isDefault = false, length, width, height, capacity } = body;

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
        ...(length !== undefined && { length }),
        ...(width !== undefined && { width }),
        ...(height !== undefined && { height }),
        ...(capacity !== undefined && { capacity }),
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
        length: warehouse.length ? Number(warehouse.length) : null,
        width: warehouse.width ? Number(warehouse.width) : null,
        height: warehouse.height ? Number(warehouse.height) : null,
        capacity: warehouse.capacity ? Number(warehouse.capacity) : null,
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
