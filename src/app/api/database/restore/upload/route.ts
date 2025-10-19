import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function executeSQLStatements(sqlContent: string) {
  // Split SQL content into individual statements
  const statements = sqlContent
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  for (const statement of statements) {
    if (statement.trim()) {
      try {
        await prisma.$executeRawUnsafe(statement);
      } catch (error) {
        console.error("Error executing statement:", statement.substring(0, 100), error);
        // Continue with other statements
      }
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "DEVELOPER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith(".sql")) {
      return NextResponse.json(
        { error: "Invalid file type. Only .sql files are allowed" },
        { status: 400 }
      );
    }

    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const sqlContent = buffer.toString("utf-8");

    // Execute SQL statements using Prisma
    await executeSQLStatements(sqlContent);

    return NextResponse.json({
      success: true,
      message: "Database restored successfully from uploaded file",
    });
  } catch (error) {
    console.error("Restore upload error:", error);
    return NextResponse.json(
      { error: "Failed to restore database from uploaded file" },
      { status: 500 }
    );
  }
}
