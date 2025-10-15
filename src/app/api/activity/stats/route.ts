import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';

export async function GET() {
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

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get statistics
    const [
      totalActivitiesToday,
      uniqueUsersToday,
      totalActivities,
      activityTypeCounts,
    ] = await Promise.all([
      // Total activities today
      prisma.activity.count({
        where: {
          created_at: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      // Unique users active today
      prisma.activity.groupBy({
        by: ['userId'],
        where: {
          created_at: {
            gte: today,
            lt: tomorrow,
          },
        },
      }).then(result => result.length),
      // Total activities in system
      prisma.activity.count(),
      // Activity type counts
      prisma.activity.groupBy({
        by: ['type'],
        _count: {
          type: true,
        },
        orderBy: {
          _count: {
            type: 'desc',
          },
        },
      }),
    ]);

    // Find most common activity type
    const mostCommonActivityType = activityTypeCounts.length > 0 
      ? activityTypeCounts[0].type 
      : 'N/A';

    return NextResponse.json({
      success: true,
      data: {
        totalActivitiesToday,
        uniqueUsersToday,
        totalActivities,
        mostCommonActivityType,
        activityTypeCounts: activityTypeCounts.map(item => ({
          type: item.type,
          count: item._count.type,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching activity stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch activity statistics" },
      { status: 500 }
    );
  }
}
