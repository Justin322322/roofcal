import { NextResponse } from "next/server";
import { getMaintenanceStatus } from "@/lib/maintenance-utils";

export async function GET() {
  try {
    const settings = await getMaintenanceStatus();
    
    // Return minimal info for public access
    return NextResponse.json({
      maintenanceMode: settings.maintenanceMode,
      maintenanceMessage: settings.maintenanceMessage,
      maintenanceScheduledEnd: settings.maintenanceScheduledEnd,
    });
  } catch (error) {
    console.error("Error fetching maintenance status:", error);
    return NextResponse.json(
      { error: "Failed to fetch maintenance status" },
      { status: 500 }
    );
  }
}

