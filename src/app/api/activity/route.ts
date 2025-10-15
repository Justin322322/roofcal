import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { activity_type } from "@prisma/client";

export const runtime = 'nodejs';

interface ActivityFilters {
  userId?: string;
  type?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

type ActivityWithUser = Prisma.activityGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
        email: true;
      };
    };
  };
}>;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Only DEVELOPER role can access activity logs
    if (session.user.role !== 'DEVELOPER') {
      return NextResponse.json(
        { success: false, error: "Access denied. Developer role required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const filters: ActivityFilters = {
      userId: searchParams.get("userId") || undefined,
      type: searchParams.get("type") || undefined,
      search: searchParams.get("search") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "25"),
      sortBy: searchParams.get("sortBy") || "created_at",
      sortOrder: (searchParams.get("sortOrder") as 'asc' | 'desc') || "desc",
    };

    // Build where clause
    const where: Prisma.activityWhereInput = {};

    // Filter by user
    if (filters.userId) {
      where.userId = filters.userId;
    }

    // Filter by activity type
    if (filters.type) {
      where.type = filters.type as activity_type;
    }

    // Filter by date range
    if (filters.dateFrom || filters.dateTo) {
      where.created_at = {};
      if (filters.dateFrom) {
        where.created_at.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.created_at.lte = new Date(filters.dateTo);
      }
    }

    // Search functionality
    if (filters.search) {
      where.OR = [
        { description: { contains: filters.search } },
        { user: { firstName: { contains: filters.search } } },
        { user: { lastName: { contains: filters.search } } },
        { user: { email: { contains: filters.search } } },
      ];
    }

    // Calculate pagination
    const skip = (filters.page! - 1) * filters.limit!;
    const take = filters.limit!;

    // Build orderBy
    const orderBy: Prisma.activityOrderByWithRelationInput = {};
    if (filters.sortBy === 'created_at') {
      orderBy.created_at = filters.sortOrder!;
    } else if (filters.sortBy === 'type') {
      orderBy.type = filters.sortOrder!;
    } else if (filters.sortBy === 'description') {
      orderBy.description = filters.sortOrder!;
    } else {
      orderBy.created_at = 'desc';
    }

    // Get activities and total count
    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.activity.count({ where }),
    ]);

    const totalPages = Math.ceil(total / filters.limit!);

    // Format activities for response
    const formattedActivities = activities.map((activity: ActivityWithUser) => ({
      id: activity.id,
      type: activity.type,
      description: activity.description,
      metadata: activity.metadata,
      createdAt: activity.created_at.toISOString(),
      user: {
        id: activity.user.id,
        name: `${activity.user.firstName} ${activity.user.lastName}`,
        email: activity.user.email,
      },
    }));

    return NextResponse.json({
      success: true,
      data: {
        activities: formattedActivities,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          totalPages,
          hasNext: filters.page! < totalPages,
          hasPrev: filters.page! > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch activity logs" },
      { status: 500 }
    );
  }
}
