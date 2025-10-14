import { prisma } from "@/lib/prisma";

/**
 * List of tables that are editable in the database management UI
 */
export const EDITABLE_TABLES = [
  "user",
  "project",
  "warehouse",
  "pricingConfig",
  "warehousematerial",
  "projectmaterial",
  "notification",
] as const;

/**
 * List of tables that are read-only (sensitive data)
 */
export const READ_ONLY_TABLES = [
  "activity",
  "verificationcode",
  "ratelimit",
  "systemsettings",
] as const;

/**
 * All available table names in the database
 */
export const ALL_TABLES = [...EDITABLE_TABLES, ...READ_ONLY_TABLES] as readonly string[];

export type TableName = (typeof ALL_TABLES)[number];

/**
 * Check if a table is editable
 */
export function isTableEditable(tableName: string): boolean {
  return EDITABLE_TABLES.includes(tableName as (typeof EDITABLE_TABLES)[number]);
}

/**
 * Get all table names
 */
export function getAllTableNames(): readonly string[] {
  return ALL_TABLES;
}

/**
 * Get table schema (column definitions)
 * Returns basic schema information for a given table
 */
export async function getTableSchema(tableName: string) {
  // For Prisma, we can use introspection to get schema info
  // This is a simplified version that returns basic info
  const schema = await prisma.$queryRawUnsafe<Array<{
    Field: string;
    Type: string;
    Null: string;
    Key: string;
    Default: string | null;
    Extra: string;
  }>>(`DESCRIBE ${tableName}`);

  return schema.map((column) => ({
    name: column.Field,
    type: column.Type,
    nullable: column.Null === "YES",
    key: column.Key,
    default: column.Default,
    extra: column.Extra,
  }));
}

/**
 * Get table data with pagination, sorting, and filtering
 */
export async function getTableData(
  tableName: string,
  options: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    search?: string;
  } = {}
) {
  const {
    page = 1,
    pageSize = 50,
    sortBy,
    sortOrder = "asc",
    search,
  } = options;

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  // Build the query dynamically based on table name
  // This is a simplified version - in production, you'd want more robust handling
  let whereClause = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let orderBy: any = {};

  // Add search functionality if search term is provided
  if (search) {
    // This is a basic implementation - you'd want to search across all text fields
    whereClause = {
      OR: [
        { id: { contains: search } },
        // Add more searchable fields based on table structure
      ],
    };
  }

  // Add sorting
  if (sortBy) {
    orderBy = { [sortBy]: sortOrder };
  } else {
    // Default sorting by id
    orderBy = { id: "asc" };
  }

  // Get total count for pagination
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalCount = await (prisma as any)[tableName].count({
    where: whereClause,
  });

  // Get paginated data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await (prisma as any)[tableName].findMany({
    where: whereClause,
    skip,
    take,
    orderBy,
  });

  return {
    data,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    },
  };
}

/**
 * Update a record in a table
 */
export async function updateTableRecord(
  tableName: string,
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>
) {
  // Validate that the table is editable
  if (!isTableEditable(tableName)) {
    throw new Error(`Table ${tableName} is not editable`);
  }

  // Remove id from data if present (shouldn't be updated)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _, ...updateData } = data;

  // Update the record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updated = await (prisma as any)[tableName].update({
    where: { id },
    data: updateData,
  });

  return updated;
}

/**
 * Delete a record from a table
 */
export async function deleteTableRecord(tableName: string, id: string) {
  // Validate that the table is editable
  if (!isTableEditable(tableName)) {
    throw new Error(`Table ${tableName} is not editable`);
  }

  // Delete the record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deleted = await (prisma as any)[tableName].delete({
    where: { id },
  });

  return deleted;
}

/**
 * Get a single record by ID
 */
export async function getTableRecord(tableName: string, id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const record = await (prisma as any)[tableName].findUnique({
    where: { id },
  });

  return record;
}

/**
 * Create a new record in a table
 */
export async function createTableRecord(
  tableName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>
) {
  // Validate that the table is editable
  if (!isTableEditable(tableName)) {
    throw new Error(`Table ${tableName} is not editable`);
  }

  // Create the record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const created = await (prisma as any)[tableName].create({
    data,
  });

  return created;
}

/**
 * Get table statistics
 */
export async function getTableStats(tableName: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const count = await (prisma as any)[tableName].count();
  
  // Get the most recent record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const latest = await (prisma as any)[tableName].findFirst({
    orderBy: { created_at: "desc" },
  });

  return {
    totalRecords: count,
    latestRecord: latest,
  };
}

