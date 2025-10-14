import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { UserRole } from "@/types/user-role";
import {
  getMaintenanceStatus,
  enableMaintenance,
  disableMaintenance,
  updateMaintenanceSettings,
} from "@/lib/maintenance-utils";

export const runtime = 'nodejs';

export async function GET() {
  try {
    const settings = await getMaintenanceStatus();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching maintenance status:", error);
    return NextResponse.json(
      { error: "Failed to fetch maintenance status" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is DEVELOPER
    if (session?.user?.role !== UserRole.DEVELOPER) {
      return NextResponse.json(
        { error: "Unauthorized - DEVELOPER role required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, message, scheduledEnd } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }

    let result;

    if (action === "enable") {
      result = await enableMaintenance(
        session.user.id,
        message,
        scheduledEnd ? new Date(scheduledEnd) : undefined
      );
    } else if (action === "disable") {
      result = await disableMaintenance();
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error managing maintenance mode:", error);
    return NextResponse.json(
      { error: "Failed to manage maintenance mode" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is DEVELOPER
    if (session?.user?.role !== UserRole.DEVELOPER) {
      return NextResponse.json(
        { error: "Unauthorized - DEVELOPER role required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { maintenanceMode, message, scheduledEnd } = body;

    if (typeof maintenanceMode !== "boolean") {
      return NextResponse.json(
        { error: "maintenanceMode is required" },
        { status: 400 }
      );
    }

    const result = await updateMaintenanceSettings(
      session.user.id,
      maintenanceMode,
      message,
      scheduledEnd ? new Date(scheduledEnd) : undefined
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating maintenance settings:", error);
    return NextResponse.json(
      { error: "Failed to update maintenance settings" },
      { status: 500 }
    );
  }
}

