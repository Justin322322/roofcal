import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { UserRole } from "@/types/user-role";
import {
  getTableData,
  updateTableRecord,
  deleteTableRecord,
  createTableRecord,
} from "@/lib/database-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is DEVELOPER
    if (session?.user?.role !== UserRole.DEVELOPER) {
      return NextResponse.json(
        { error: "Unauthorized - DEVELOPER role required" },
        { status: 403 }
      );
    }

    const { table } = await params;
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");
    const sortBy = searchParams.get("sortBy") || undefined;
    const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "asc";
    const search = searchParams.get("search") || undefined;

    const result = await getTableData(table, {
      page,
      pageSize,
      sortBy,
      sortOrder,
      search,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching table data:", error);
    return NextResponse.json(
      { error: "Failed to fetch table data" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is DEVELOPER
    if (session?.user?.role !== UserRole.DEVELOPER) {
      return NextResponse.json(
        { error: "Unauthorized - DEVELOPER role required" },
        { status: 403 }
      );
    }

    const { table } = await params;
    const body = await request.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await createTableRecord(table, body as any);

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error creating record:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create record";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is DEVELOPER
    if (session?.user?.role !== UserRole.DEVELOPER) {
      return NextResponse.json(
        { error: "Unauthorized - DEVELOPER role required" },
        { status: 403 }
      );
    }

    const { table } = await params;
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await updateTableRecord(table, id, data as any);

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error updating record:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update record";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is DEVELOPER
    if (session?.user?.role !== UserRole.DEVELOPER) {
      return NextResponse.json(
        { error: "Unauthorized - DEVELOPER role required" },
        { status: 403 }
      );
    }

    const { table } = await params;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await deleteTableRecord(table, id as any);

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error deleting record:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete record";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

