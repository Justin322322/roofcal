import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/types/user-role";

export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isContractor = session.user.role === UserRole.ADMIN;

    if (isContractor) {
      // Enhanced contractor statistics
      const [
        totalAssignedProjects,
        activeAssignedProjects,
        completedAssignedProjects,
        totalContractorValue,
        proposalsSent,
        proposalsAccepted,
        proposalsRejected,
        uniqueClients,
        averageProjectDuration,
      ] = await Promise.all([
        // Total assigned projects
        prisma.project.count({
          where: { contractorId: session.user.id },
        }),
        // Active assigned projects
        prisma.project.count({
          where: {
            contractorId: session.user.id,
            status: { in: ["ACCEPTED", "IN_PROGRESS"] },
          },
        }),
        // Completed assigned projects
        prisma.project.count({
          where: {
            contractorId: session.user.id,
            status: "COMPLETED",
          },
        }),
        // Total value of completed projects
        prisma.project.aggregate({
          where: {
            contractorId: session.user.id,
            status: "COMPLETED",
          },
          _sum: { totalCost: true },
        }),
        // Proposals sent
        prisma.project.count({
          where: {
            contractorId: session.user.id,
            proposalSent: { not: null },
          },
        }),
        // Proposals accepted
        prisma.project.count({
          where: {
            contractorId: session.user.id,
            proposalStatus: "ACCEPTED",
          },
        }),
        // Proposals rejected
        prisma.project.count({
          where: {
            contractorId: session.user.id,
            proposalStatus: "REJECTED",
          },
        }),
        // Unique clients
        prisma.project.findMany({
          where: { contractorId: session.user.id },
          select: { clientId: true },
          distinct: ["clientId"],
        }),
        // Average project duration (from assigned to completed)
        prisma.project.findMany({
          where: {
            contractorId: session.user.id,
            status: "COMPLETED",
            assignedAt: { not: null },
          },
          select: {
            assignedAt: true,
            updated_at: true,
          },
        }),
      ]);

      const totalContractorValueNum = Number(totalContractorValue._sum.totalCost) || 0;
      const averageProjectValue = completedAssignedProjects > 0 ? totalContractorValueNum / completedAssignedProjects : 0;
      const proposalAcceptanceRate = proposalsSent > 0 ? (proposalsAccepted / proposalsSent) * 100 : 0;
      const completionRate = totalAssignedProjects > 0 ? (completedAssignedProjects / totalAssignedProjects) * 100 : 0;
      const uniqueClientsCount = uniqueClients.length;

      // Calculate average project duration
      let averageDurationDays = 0;
      if (averageProjectDuration.length > 0) {
        const totalDays = averageProjectDuration.reduce((sum, project) => {
          if (project.assignedAt) {
            const durationMs = project.updated_at.getTime() - project.assignedAt.getTime();
            return sum + Math.round(durationMs / (1000 * 60 * 60 * 24)); // Convert to days
          }
          return sum;
        }, 0);
        averageDurationDays = Math.round(totalDays / averageProjectDuration.length);
      }

      return NextResponse.json({
        // Basic stats
        totalProjects: totalAssignedProjects,
        activeProjects: activeAssignedProjects,
        completedProjects: completedAssignedProjects,
        totalValue: totalContractorValueNum,
        averageValue: averageProjectValue,
        
        // Contractor-specific metrics
        contractorMetrics: {
          proposalsSent,
          proposalsAccepted,
          proposalsRejected,
          proposalAcceptanceRate: Math.round(proposalAcceptanceRate * 100) / 100,
          completionRate: Math.round(completionRate * 100) / 100,
          uniqueClients: uniqueClientsCount,
          averageProjectDurationDays: averageDurationDays,
        },
      });
    } else {
      // Client statistics (original logic)
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
    }
  } catch (error) {
    console.error("Error fetching project stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
