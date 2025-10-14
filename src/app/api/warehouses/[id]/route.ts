import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/types/user-role";

// GET /api/warehouses/[id] - Get specific warehouse details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!warehouse) {
      return NextResponse.json(
        { error: "Warehouse not found" },
        { status: 404 }
      );
    }

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
    console.error("Error fetching warehouse:", error);
    return NextResponse.json(
      { error: "Failed to fetch warehouse" },
      { status: 500 }
    );
  }
}

// PUT /api/warehouses/[id] - Update warehouse
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, address, city, state, zipCode, latitude, longitude, isDefault, length, width, height, capacity } = body;
    
    console.log('Warehouse update request data:', {
      id, name, address, city, state, zipCode, latitude, longitude, isDefault, 
      length, width, height, capacity
    });

    // Check if warehouse exists
    const existingWarehouse = await prisma.warehouse.findUnique({
      where: { id },
    });

    if (!existingWarehouse) {
      return NextResponse.json(
        { error: "Warehouse not found" },
        { status: 404 }
      );
    }

    // Check permissions: Only the creator or admin can update
    if (existingWarehouse.created_by !== session.user.id && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await prisma.warehouse.updateMany({
        where: { 
          isDefault: true,
          id: { not: id }
        },
        data: { isDefault: false },
      });
    }

    const warehouse = await prisma.warehouse.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(address && { address }),
        ...(city && { city }),
        ...(state && { state }),
        ...(zipCode && { zipCode }),
        ...(latitude && { latitude }),
        ...(longitude && { longitude }),
        ...(isDefault !== undefined && { isDefault }),
        ...(length !== undefined && { length }),
        ...(width !== undefined && { width }),
        ...(height !== undefined && { height }),
        ...(capacity !== undefined && { capacity }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    const responseData = {
      ...warehouse,
      latitude: Number(warehouse.latitude),
      longitude: Number(warehouse.longitude),
      length: warehouse.length ? Number(warehouse.length) : null,
      width: warehouse.width ? Number(warehouse.width) : null,
      height: warehouse.height ? Number(warehouse.height) : null,
      capacity: warehouse.capacity ? Number(warehouse.capacity) : null,
    };
    
    console.log('Warehouse update response data:', responseData);

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error updating warehouse:", error);
    return NextResponse.json(
      { error: "Failed to update warehouse" },
      { status: 500 }
    );
  }
}

// DELETE /api/warehouses/[id] - Delete warehouse
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    // Check if warehouse exists
    const existingWarehouse = await prisma.warehouse.findUnique({
      where: { id },
    });

    if (!existingWarehouse) {
      return NextResponse.json(
        { error: "Warehouse not found" },
        { status: 404 }
      );
    }

    // Check permissions: Only the creator or admin can delete
    if (existingWarehouse.created_by !== session.user.id && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    await prisma.warehouse.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Warehouse deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting warehouse:", error);
    return NextResponse.json(
      { error: "Failed to delete warehouse" },
      { status: 500 }
    );
  }
}
