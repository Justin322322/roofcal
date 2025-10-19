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

    const { filename } = await request.json();

    if (!filename) {
      return NextResponse.json(
        { error: "Filename required" },
        { status: 400 }
      );
    }

    // Security: prevent path traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return NextResponse.json(
        { error: "Invalid filename" },
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
    const backupsDir = path.join(process.cwd(), "backups");
    const filepath = path.join(backupsDir, filename);

    if (!fs.existsSync(filepath)) {
      return NextResponse.json(
        { error: "Backup file not found" },
        { status: 404 }
      );
    }

    const restoreCommand = [
      "mysql",
      `--host=${dbConfig.host}`,
      `--port=${dbConfig.port}`,
      `--user=${dbConfig.user}`,
      `--password=${dbConfig.password}`,
      dbConfig.database,
      `< "${filepath}"`,
    ].join(" ");

    await execAsync(restoreCommand, {
      maxBuffer: 1024 * 1024 * 100,
      shell: process.platform === "win32" ? "cmd.exe" : "/bin/bash",
    });

    return NextResponse.json({
      success: true,
      message: "Database restored successfully",
    });
  } catch (error) {
    console.error("Restore error:", error);
    return NextResponse.json(
      { error: "Failed to restore database" },
      { status: 500 }
    );
  }
}
