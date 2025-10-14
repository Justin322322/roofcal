import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { UserRole } from "@/types/user-role";
import { getTableSchema } from "@/lib/database-utils";


export const runtime = 'nodejs';

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
    const schema = await getTableSchema(table);

    return NextResponse.json({ schema });
  } catch (error) {
    console.error("Error fetching table schema:", error);
    return NextResponse.json(
      { error: "Failed to fetch table schema" },
      { status: 500 }
    );
  }
}

