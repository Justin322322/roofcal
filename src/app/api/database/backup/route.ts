import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function generateSQLBackup() {
  const tables = [
    "user",
    "project",
    "PricingConfig",
    "warehouse",
    "WarehouseMaterial",
    "ProjectMaterial",
    "Notification",
    "activity",
    "verificationcode",
    "ratelimit",
    "systemsettings",
  ];

  let sqlContent = `-- Database Backup\n`;
  sqlContent += `-- Generated: ${new Date().toISOString()}\n`;
  sqlContent += `-- Platform: Serverless (Prisma-based backup)\n\n`;
  sqlContent += `SET FOREIGN_KEY_CHECKS=0;\n\n`;

  for (const table of tables) {
    try {
      // Get table data using Prisma's raw query
      const modelName = table.charAt(0).toLowerCase() + table.slice(1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await (prisma as any)[modelName]?.findMany();

      if (!data || data.length === 0) continue;

      sqlContent += `-- Table: ${table}\n`;
      sqlContent += `DELETE FROM \`${table}\`;\n`;

      // Generate INSERT statements
      for (const row of data) {
        const columns = Object.keys(row);
        const values = columns.map((col) => {
          const val = row[col];
          if (val === null || val === undefined) return "NULL";
          if (typeof val === "boolean") return val ? "1" : "0";
          if (typeof val === "number") return val.toString();
          if (val instanceof Date) return `'${val.toISOString()}'`;
          if (typeof val === "object") return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
          return `'${String(val).replace(/'/g, "''")}'`;
        });

        sqlContent += `INSERT INTO \`${table}\` (\`${columns.join("`, `")}\`) VALUES (${values.join(", ")});\n`;
      }

      sqlContent += `\n`;
    } catch (error) {
      console.error(`Error backing up table ${table}:`, error);
      // Continue with other tables
    }
  }

  sqlContent += `SET FOREIGN_KEY_CHECKS=1;\n`;
  return sqlContent;
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "DEVELOPER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
    const filename = `backup-${timestamp}.sql`;

    // Generate SQL backup using Prisma
    const sqlContent = await generateSQLBackup();
    
    const fileSizeKB = (Buffer.byteLength(sqlContent, "utf8") / 1024).toFixed(2);
    const fileSizeMB = (parseFloat(fileSizeKB) / 1024).toFixed(2);

    return NextResponse.json({
      success: true,
      filename,
      size: fileSizeMB,
      content: sqlContent,
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

    // On serverless, we don't persist backups
    // Return empty array - users should download backups immediately
    return NextResponse.json({ 
      backups: [],
      message: "Backups are not stored on serverless platforms. Please download backups immediately after creation."
    });
  } catch (error) {
    console.error("List backups error:", error);
    return NextResponse.json(
      { error: "Failed to list backups" },
      { status: 500 }
    );
  }
}
