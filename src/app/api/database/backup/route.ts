import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";

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

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "DEVELOPER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
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

    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
    const filename = `backup-${dbConfig.database}-${timestamp}.sql`;
    const filepath = path.join(backupsDir, filename);

    const dumpCommand = [
      "mysqldump",
      `--host=${dbConfig.host}`,
      `--port=${dbConfig.port}`,
      `--user=${dbConfig.user}`,
      `--password=${dbConfig.password}`,
      "--single-transaction",
      "--routines",
      "--triggers",
      "--events",
      dbConfig.database,
      `> "${filepath}"`,
    ].join(" ");

    await execAsync(dumpCommand, {
      maxBuffer: 1024 * 1024 * 100,
      shell: process.platform === "win32" ? "cmd.exe" : "/bin/bash",
    });

    const stats = fs.statSync(filepath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    return NextResponse.json({
      success: true,
      filename,
      size: fileSizeMB,
      path: filepath,
    });
  } catch (error) {
    console.error("Backup error:", error);
    return NextResponse.json(
      { error: "Failed to create backup" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "DEVELOPER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const backupsDir = path.join(process.cwd(), "backups");

    if (!fs.existsSync(backupsDir)) {
      return NextResponse.json({ backups: [] });
    }

    const files = fs
      .readdirSync(backupsDir)
      .filter((f) => f.startsWith("backup-") && f.endsWith(".sql"))
      .map((f) => {
        const filepath = path.join(backupsDir, f);
        const stats = fs.statSync(filepath);
        return {
          name: f,
          size: (stats.size / (1024 * 1024)).toFixed(2),
          created: stats.mtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

    return NextResponse.json({ backups: files });
  } catch (error) {
    console.error("List backups error:", error);
    return NextResponse.json(
      { error: "Failed to list backups" },
      { status: 500 }
    );
  }
}
