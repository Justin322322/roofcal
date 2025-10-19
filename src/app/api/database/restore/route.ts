import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "DEVELOPER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // On serverless platforms, backups are not stored server-side
    // Users should use the upload endpoint instead
    return NextResponse.json(
      { 
        error: "Server-side backups not available on serverless platforms. Please use file upload to restore.",
        useUpload: true
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Restore error:", error);
    return NextResponse.json(
      { error: "Failed to restore database" },
      { status: 500 }
    );
  }
}
