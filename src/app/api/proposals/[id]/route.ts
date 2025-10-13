import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";
import { notifyProposalAccepted, notifyProposalRejected } from "@/lib/notifications";

// PATCH /api/proposals/[id] - Client accepts/rejects proposal
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, reason } = body; // action: "accept" | "reject"

    if (!action || !["accept", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Valid action (accept/reject) is required" },
        { status: 400 }
      );
    }

    // Get the project with contractor information
    const project = await prisma.project.findFirst({
      where: {
        id,
        clientId: session.user.id, // Only the client can accept/reject proposals
        proposalStatus: "SENT", // Only proposals that have been sent can be accepted/rejected
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
        { error: "Project not found, access denied, or proposal not available" },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let updateData: any = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let notificationData: any;

    if (action === "accept") {
      updateData = {
        proposalStatus: "ACCEPTED",
        status: "ACCEPTED",
      };
      
      notificationData = {
        type: "proposal_accepted",
        projectId: id,
        projectName: project.projectName,
        fromUserId: session.user.id,
        fromUserName: session.user.name || session.user.email!,
        toUserId: project.contractor!.id,
        toUserName: `${project.contractor!.firstName} ${project.contractor!.lastName}`,
        toUserEmail: project.contractor!.email,
      };
    } else if (action === "reject") {
      updateData = {
        proposalStatus: "REJECTED",
        status: "DRAFT", // Reset to draft so client can request new quotes
        notes: reason ? `${project.notes || ""}\n\nRejection reason: ${reason}`.trim() : project.notes || undefined,
      };
      
      notificationData = {
        type: "proposal_rejected",
        projectId: id,
        projectName: project.projectName,
        fromUserId: session.user.id,
        fromUserName: session.user.name || session.user.email!,
        toUserId: project.contractor!.id,
        toUserName: `${project.contractor!.firstName} ${project.contractor!.lastName}`,
        toUserEmail: project.contractor!.email,
      };
    }

    // Update the project
    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    // Send notification to contractor
    if (action === "accept") {
      await notifyProposalAccepted(
        notificationData.projectId,
        notificationData.projectName,
        notificationData.fromUserId,
        notificationData.fromUserName,
        notificationData.toUserId,
        notificationData.toUserName,
        notificationData.toUserEmail
      );
    } else {
      await notifyProposalRejected(
        notificationData.projectId,
        notificationData.projectName,
        notificationData.fromUserId,
        notificationData.fromUserName,
        notificationData.toUserId,
        notificationData.toUserName,
        notificationData.toUserEmail
      );
    }

    return NextResponse.json({
      success: true,
      message: action === "accept" 
        ? "Proposal accepted successfully" 
        : "Proposal rejected successfully",
      project: {
        ...updatedProject,
        // Convert Decimal to number for JSON response
        length: Number(updatedProject.length),
        width: Number(updatedProject.width),
        pitch: Number(updatedProject.pitch),
        budgetAmount: updatedProject.budgetAmount
          ? Number(updatedProject.budgetAmount)
          : undefined,
        gutterLengthA: updatedProject.gutterLengthA
          ? Number(updatedProject.gutterLengthA)
          : undefined,
        gutterSlope: updatedProject.gutterSlope
          ? Number(updatedProject.gutterSlope)
          : undefined,
        gutterLengthC: updatedProject.gutterLengthC
          ? Number(updatedProject.gutterLengthC)
          : undefined,
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
        latitude: updatedProject.latitude ? Number(updatedProject.latitude) : null,
        longitude: updatedProject.longitude ? Number(updatedProject.longitude) : null,
        deliveryCost: updatedProject.deliveryCost ? Number(updatedProject.deliveryCost) : null,
        deliveryDistance: updatedProject.deliveryDistance ? Number(updatedProject.deliveryDistance) : null,
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
