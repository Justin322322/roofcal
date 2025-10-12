import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/types/user-role";
import { notifyProposalAccepted, notifyProposalRejected } from "@/lib/notifications";

// PATCH /api/proposals/[id] - Accept or reject a proposal
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body; // "accept" or "reject"

    if (!action || !["accept", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be 'accept' or 'reject'" },
        { status: 400 }
      );
    }

    // Verify the project exists and user has access
    const project = await prisma.project.findFirst({
      where: {
        id,
        OR: [
          { clientId: session.user.id }, // Client can accept/reject
          { contractorId: session.user.id }, // Contractor can also manage their proposals
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

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    // Check if this is actually a proposal
    if (!project.proposalSent) {
      return NextResponse.json(
        { error: "This project does not have a proposal" },
        { status: 400 }
      );
    }

    let updateData: {
      proposalStatus?: "ACCEPTED" | "REJECTED";
      status?: "ACCEPTED" | "REJECTED" | "CONTRACTOR_REVIEWING";
    } = {};

    if (action === "accept") {
      // Only clients can accept proposals
      if (session.user.role !== UserRole.CLIENT || project.clientId !== session.user.id) {
        return NextResponse.json(
          { error: "Only the client can accept proposals" },
          { status: 403 }
        );
      }

      updateData = {
        proposalStatus: "ACCEPTED",
        status: "ACCEPTED",
      };
    } else if (action === "reject") {
      // Both client and contractor can reject (contractor can withdraw proposal)
      if (session.user.role === UserRole.CLIENT && project.clientId !== session.user.id) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }

      updateData = {
        proposalStatus: "REJECTED",
        status: session.user.role === UserRole.CLIENT ? "REJECTED" : "CONTRACTOR_REVIEWING",
      };
    }

    // Update the project
    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    // Send appropriate notifications
    if (action === "accept" && project.contractor) {
      await notifyProposalAccepted(
        id,
        project.projectName,
        session.user.id,
        session.user.name || "User",
        project.contractor.id,
        `${project.contractor.firstName} ${project.contractor.lastName}`,
        project.contractor.email
      );
    } else if (action === "reject" && project.contractor) {
      await notifyProposalRejected(
        id,
        project.projectName,
        session.user.id,
        session.user.name || "User",
        project.contractor.id,
        `${project.contractor.firstName} ${project.contractor.lastName}`,
        project.contractor.email
      );
    }

    return NextResponse.json({
      message: `Proposal ${action}ed successfully`,
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
    console.error("Error updating proposal:", error);
    return NextResponse.json(
      { error: "Failed to update proposal" },
      { status: 500 }
    );
  }
}
