import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { UserRole } from "@/types/user-role";
import { getAllTableNames } from "@/lib/database-utils";


export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is DEVELOPER
    if (session?.user?.role !== UserRole.DEVELOPER) {
      return NextResponse.json(
        { error: "Unauthorized - DEVELOPER role required" },
        { status: 403 }
      );
    }

    const tables = getAllTableNames();
    return NextResponse.json({ tables });
  } catch (error) {
    console.error("Error fetching tables:", error);
    return NextResponse.json(
      { error: "Failed to fetch tables" },
      { status: 500 }
    );
  }
}

