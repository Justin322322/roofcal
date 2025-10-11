import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get project statistics
    const [totalProjects, activeProjects, completedProjects, totalValueResult] =
      await Promise.all([
        prisma.project.count({
          where: { userId: session.user.id },
        }),
        prisma.project.count({
          where: {
            userId: session.user.id,
            status: "ACTIVE",
          },
        }),
        prisma.project.count({
          where: {
            userId: session.user.id,
            status: "COMPLETED",
          },
        }),
        prisma.project.aggregate({
          where: { userId: session.user.id },
          _sum: { totalCost: true },
        }),
      ]);

    const totalValue = Number(totalValueResult._sum.totalCost) || 0;
    const averageValue = totalProjects > 0 ? totalValue / totalProjects : 0;

    return NextResponse.json({
      totalProjects,
      activeProjects,
      completedProjects,
      totalValue,
      averageValue,
    });
  } catch (error) {
    console.error("Error fetching project stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
