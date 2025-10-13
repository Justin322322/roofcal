import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";
import { notifyProposalSent } from "@/lib/notifications";
import { UserRole } from "@/types/user-role";

// POST /api/proposals - Create or update proposal for a project
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const {
      projectId,
      customMaterialCost,
      customLaborCost,
      customDeliveryCost,
      additionalLineItems,
      totalAmount,
      validityDays,
      notes,
      status = "DRAFT",
    } = body;

    if (!projectId || !totalAmount) {
      return NextResponse.json(
        { error: "Project ID and total amount are required" },
        { status: 400 }
      );
    }

    // Get the project with client information
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        contractorId: session.user.id, // Only the assigned contractor can create proposals
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

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    // Validate project status
    if (project.status !== "CONTRACTOR_REVIEWING") {
      return NextResponse.json(
        { error: "Project must be in CONTRACTOR_REVIEWING status to create proposals" },
        { status: 400 }
      );
    }

    // Calculate validity date
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + (validityDays || 30));

    // Store proposal data in project fields (we'll use existing fields for now)
    // In a more complex system, you might want a separate Proposal table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      proposalStatus: status,
      notes: notes || project.notes, // Store proposal notes in project notes for now
    };

    // If sending the proposal, update status and timestamp
    if (status === "SENT") {
      updateData.proposalSent = new Date();
      updateData.status = "PROPOSAL_SENT";
    }

    // Update the project with proposal information
    await prisma.project.update({
      where: { id: projectId },
      data: updateData,
    });

    // Send notification if proposal is being sent
    if (status === "SENT" && project.client) {
      await notifyProposalSent(
        projectId,
        project.projectName,
        session.user.id,
        session.user.name || session.user.email!,
        project.client.id,
        `${project.client.firstName} ${project.client.lastName}`,
        project.client.email
      );
    }

    return NextResponse.json({
      success: true,
      message: status === "SENT" ? "Proposal sent successfully" : "Proposal saved as draft",
      proposal: {
        id: projectId,
        status,
        totalAmount,
        validUntil: validUntil.toISOString(),
        customMaterialCost,
        customLaborCost,
        customDeliveryCost,
        additionalLineItems,
        notes,
      },
    });
  } catch (error) {
    console.error("Error creating proposal:", error);
    return NextResponse.json(
      { error: "Failed to create proposal" },
      { status: 500 }
    );
  }
}

// GET /api/proposals - Get proposals for a contractor or client
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    searchParams.get("role");

    let projects;

    if (projectId) {
      // Get specific project proposal
      projects = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { userId: session.user.id },
            { contractorId: session.user.id },
            { clientId: session.user.id },
          ],
        },
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
      });

      if (!projects) {
        return NextResponse.json(
          { error: "Project not found or access denied" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        project: projects,
      });
    } else {
      // Get all projects with proposals based on user role
      if (session.user.role === UserRole.ADMIN) {
        // Contractor view - get projects assigned to them
        projects = await prisma.project.findMany({
          where: {
            contractorId: session.user.id,
            proposalStatus: { not: null },
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
          },
          orderBy: {
            proposalSent: "desc",
          },
        });
      } else {
        // Client view - get their projects with proposals
        projects = await prisma.project.findMany({
          where: {
            clientId: session.user.id,
            proposalStatus: { not: null },
          },
          include: {
            contractor: {
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
      }

      return NextResponse.json({
        success: true,
        projects,
      });
    }
  } catch (error) {
    console.error("Error fetching proposals:", error);
    return NextResponse.json(
      { error: "Failed to fetch proposals" },
      { status: 500 }
    );
  }
}
