import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";
import {
  FolderIcon,
  CheckCircleIcon,
  ClockIcon,
  DollarSignIcon,
} from "lucide-react";

export async function ProjectStatsCards() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  try {
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

    const stats = [
      {
        title: "Total Projects",
        value: totalProjects.toString(),
        description: "All projects created",
        icon: FolderIcon,
        color: "text-blue-600",
      },
      {
        title: "Active Projects",
        value: activeProjects.toString(),
        description: "Projects in progress",
        icon: ClockIcon,
        color: "text-yellow-600",
      },
      {
        title: "Completed",
        value: completedProjects.toString(),
        description: "Finished projects",
        icon: CheckCircleIcon,
        color: "text-green-600",
      },
      {
        title: "Total Value",
        value: `₱${totalValue.toLocaleString()}`,
        description: `Average: ₱${averageValue.toLocaleString()}`,
        icon: DollarSignIcon,
        color: "text-emerald-600",
      },
    ];

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  } catch (error) {
    console.error("Error fetching project stats:", error);
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">
                Failed to load stats
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
}
