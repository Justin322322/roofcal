import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/types/user-role";

export const runtime = 'nodejs';

// GET /api/clients - Get list of available clients (CLIENT role users)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Only ADMIN users can access client list
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Unauthorized - ADMIN role required" },
        { status: 403 }
      );
    }

    // Get all CLIENT users (not disabled)
    const clients = await prisma.user.findMany({
      where: {
        role: UserRole.CLIENT,
        isDisabled: false,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        created_at: true,
        _count: {
          select: {
            project_project_userIdTouser: true, // All projects created by this user
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Get project statistics for all clients
    const userIds = clients.map((client) => client.id);
    const projectStats =
      userIds.length > 0
        ? await prisma.project.groupBy({
            by: ["userId"],
            where: {
              userId: { in: userIds },
            },
            _count: { _all: true },
            _sum: { totalCost: true },
            _avg: { totalCost: true },
          })
        : [];

    // Map userId -> { count, totalSpend, avgSpend }
    const projectStatsByUserId = new Map<string, { count: number; totalSpend: number; avgSpend: number }>(
      projectStats.map((stat) => [
        stat.userId as string,
        {
          count: stat._count._all,
          totalSpend: Number(stat._sum.totalCost || 0),
          avgSpend: Number(stat._avg.totalCost || 0),
        },
      ])
    );

    // Transform to include client info with project statistics
    const clientList = clients.map((client) => {
      const stats = projectStatsByUserId.get(client.id) || { count: 0, totalSpend: 0, avgSpend: 0 };
      
      return {
        id: client.id,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        fullName: `${client.firstName} ${client.lastName}`,
        projectCount: stats.count,
        totalSpent: stats.totalSpend,
        avgProjectValue: stats.avgSpend,
        joinedDate: client.created_at,
        lastActive: client.created_at, // We could add last login tracking later
      };
    });

    return NextResponse.json({
      success: true,
      clients: clientList,
      total: clientList.length,
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}