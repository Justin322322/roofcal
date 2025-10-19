import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { exec } from "child_process";
import { promisify } from "util";
import * as path from "path";
import * as fs from "fs";

const execAsync = promisify(exec);

function parseDatabaseUrl(url: string) {
  const regex = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
  const match = url.match(regex);
  
  if (!match) {
    throw new Error("Invalid DATABASE_URL format");
  }

  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    database: match[5],
  };
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

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json(
        { error: "DATABASE_URL not configured" },
        { status: 500 }
      );
    }

    const dbConfig = parseDatabaseUrl(databaseUrl);
    
    // Use /tmp directory for serverless environments
    const tmpDir = process.env.VERCEL || process.env.RAILWAY_ENVIRONMENT 
      ? "/tmp" 
      : path.join(process.cwd(), "tmp");

    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    // Save uploaded file temporarily
    const timestamp = Date.now();
    const tmpFilePath = path.join(tmpDir, `restore-${timestamp}.sql`);
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(tmpFilePath, buffer);

    try {
      // Restore the database
      const restoreCommand = [
        "mysql",
        `--host=${dbConfig.host}`,
        `--port=${dbConfig.port}`,
        `--user=${dbConfig.user}`,
        `--password=${dbConfig.password}`,
        dbConfig.database,
        `< "${tmpFilePath}"`,
      ].join(" ");

      await execAsync(restoreCommand, {
        maxBuffer: 1024 * 1024 * 100,
        shell: process.platform === "win32" ? "cmd.exe" : "/bin/bash",
      });

      // Clean up temp file
      fs.unlinkSync(tmpFilePath);

      return NextResponse.json({
        success: true,
        message: "Database restored successfully from uploaded file",
      });
    } catch (error) {
      // Clean up temp file on error
      if (fs.existsSync(tmpFilePath)) {
        fs.unlinkSync(tmpFilePath);
      }
      throw error;
    }
  } catch (error) {
    console.error("Restore upload error:", error);
    return NextResponse.json(
      { error: "Failed to restore database from uploaded file" },
      { status: 500 }
    );
  }
}
