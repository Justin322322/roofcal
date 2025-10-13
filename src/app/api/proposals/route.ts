import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/types/user-role";
import { notifyProposalSent } from "@/lib/notifications";

// GET /api/proposals - Get proposals for current user (contractor or client)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "sent" or "received"
    const status = searchParams.get("status");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let whereClause: any = {};

    if (session.user.role === UserRole.ADMIN) {
      // Contractor view
      if (type === "sent") {
        whereClause = { contractorId: session.user.id };
      } else {
        // Default to received proposals (projects assigned to this contractor)
        whereClause = { 
          contractorId: session.user.id,
          proposalStatus: { not: null }
        };
      }
    } else {
      // Client view
      if (type === "received") {
        // Include projects where client is the recipient OR where client is the creator with DRAFT status
        whereClause = { 
          OR: [
            { 
              clientId: session.user.id,
              proposalStatus: { not: null }
            },
            { 
              userId: session.user.id,
              clientId: session.user.id,
              proposalStatus: "DRAFT"
            }
          ]
        };
      } else {
        // Default to sent proposals (projects this client has requested quotes for)
        whereClause = { 
          clientId: session.user.id,
          proposalStatus: { not: null }
        };
      }
    }

    // Apply status filter if specified
    if (status && status !== "ALL") {
      // If we have an OR clause, we need to handle it differently
      if (whereClause.OR) {
        whereClause = {
          AND: [
            whereClause,
            { proposalStatus: status as "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "REVISED" }
          ]
        };
      } else {
        whereClause.proposalStatus = status as "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "REVISED";
      }
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        contractor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        proposalSent: "desc",
      },
    });

    // Transform the data
    const proposals = projects.map((project) => ({
      ...project,
      // Convert Decimal to number for JSON response
      length: Number(project.length),
      width: Number(project.width),
      pitch: Number(project.pitch),
      budgetAmount: project.budgetAmount ? Number(project.budgetAmount) : undefined,
      gutterLengthA: project.gutterLengthA ? Number(project.gutterLengthA) : undefined,
      gutterSlope: project.gutterSlope ? Number(project.gutterSlope) : undefined,
      gutterLengthC: project.gutterLengthC ? Number(project.gutterLengthC) : undefined,
      area: Number(project.area),
      materialCost: Number(project.materialCost),
      gutterCost: Number(project.gutterCost),
      ridgeCost: Number(project.ridgeCost),
      screwsCost: Number(project.screwsCost),
      insulationCost: Number(project.insulationCost),
      ventilationCost: Number(project.ventilationCost),
      totalMaterialsCost: Number(project.totalMaterialsCost),
      laborCost: Number(project.laborCost),
      removalCost: Number(project.removalCost),
      totalCost: Number(project.totalCost),
      ridgeLength: Number(project.ridgeLength),
      contractor: project.contractor || {
        id: "unknown",
        firstName: "Unknown",
        lastName: "Contractor",
        email: "unknown@example.com"
      },
      client: project.client || {
        id: "unknown",
        firstName: "Unknown",
        lastName: "Client",
        email: "unknown@example.com"
      },
    }));

    return NextResponse.json({ proposals });
  } catch (error) {
    console.error("Error fetching proposals:", error);
    return NextResponse.json(
      { error: "Failed to fetch proposals" },
      { status: 500 }
    );
  }
}

// POST /api/proposals - Send a proposal
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Only contractors can send proposals
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Only contractors can send proposals" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      projectId, 
      proposalText, 
      customPricing,
      proposalStatus = "SENT"
    } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Verify the project exists and is assigned to this contractor
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        contractorId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    // Update the project with proposal details
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        proposalSent: new Date(),
        proposalStatus: proposalStatus,
        status: "PROPOSAL_SENT",
        notes: proposalText || project.notes, // Store proposal text in notes for now
        // Store custom pricing in notes as JSON for now (we could create a separate table later)
        ...(customPricing && {
          notes: JSON.stringify({
            proposalText,
            customPricing,
            originalNotes: project.notes
          })
        }),
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Send notification to client
    if (updatedProject.client) {
      await notifyProposalSent(
        projectId,
        updatedProject.projectName,
        session.user.id,
        session.user.name || "Contractor",
        updatedProject.client.id,
        `${updatedProject.client.firstName} ${updatedProject.client.lastName}`,
        updatedProject.client.email
      );
    }

    return NextResponse.json({
      message: "Proposal sent successfully",
      project: {
        ...updatedProject,
        // Convert Decimal to number for JSON response
        length: Number(updatedProject.length),
        width: Number(updatedProject.width),
        pitch: Number(updatedProject.pitch),
        budgetAmount: updatedProject.budgetAmount ? Number(updatedProject.budgetAmount) : undefined,
        gutterLengthA: updatedProject.gutterLengthA ? Number(updatedProject.gutterLengthA) : undefined,
        gutterSlope: updatedProject.gutterSlope ? Number(updatedProject.gutterSlope) : undefined,
        gutterLengthC: updatedProject.gutterLengthC ? Number(updatedProject.gutterLengthC) : undefined,
        area: Number(updatedProject.area),
        materialCost: Number(updatedProject.materialCost),
        gutterCost: Number(updatedProject.gutterCost),
        ridgeCost: Number(updatedProject.ridgeCost),
        screwsCost: Number(updatedProject.screwsCost),
        insulationCost: Number(updatedProject.insulationCost),
        ventilationCost: Number(updatedProject.ventilationCost),
        totalMaterialsCost: Number(updatedProject.totalMaterialsCost),
        laborCost: Number(updatedProject.laborCost),
        removalCost: Number(updatedProject.removalCost),
        totalCost: Number(updatedProject.totalCost),
        ridgeLength: Number(updatedProject.ridgeLength),
      },
    });
  } catch (error) {
    console.error("Error sending proposal:", error);
    return NextResponse.json(
      { error: "Failed to send proposal" },
      { status: 500 }
    );
  }
}
