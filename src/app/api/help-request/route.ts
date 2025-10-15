import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/types/user-role";

export const runtime = 'nodejs';

// POST /api/help-request - Create a help request from CLIENT to ADMIN users
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Only CLIENT users can create help requests
    if (session.user.role !== UserRole.CLIENT) {
      return NextResponse.json(
        { error: "Only clients can request help" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { message, contractorId } = body;

    if (!contractorId) {
      return NextResponse.json(
        { error: "Contractor selection is required" },
        { status: 400 }
      );
    }

    // Get the specific contractor to notify
    const contractor = await prisma.user.findFirst({
      where: {
        id: contractorId,
        role: UserRole.ADMIN,
        isDisabled: false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!contractor) {
      return NextResponse.json(
        { error: "Selected contractor not found or not available" },
        { status: 404 }
      );
    }

    // Create notification for the selected contractor
    await prisma.notification.create({
      data: {
        id: crypto.randomUUID(),
        userId: contractor.id,
        type: "HELP_REQUEST",
        title: "Client Needs Help",
        message: `${session.user.name} (${session.user.email}) needs assistance with creating a project${message ? `: "${message}"` : ""}`,
        projectId: null,
        projectName: null,
        actionUrl: `/dashboard?tab=admin-project-creation&helpRequest=true&clientId=${session.user.id}`,
        read: false,
        created_at: new Date(),
      },
    });

    console.log(`Help request notification sent to contractor ${contractor.id} for client ${session.user.id}`);

    return NextResponse.json({
      success: true,
      message: "Help request sent successfully",
      contractorId: contractor.id,
      contractorName: `${contractor.firstName} ${contractor.lastName}`,
    });
  } catch (error) {
    console.error("Error creating help request:", error);
    return NextResponse.json(
      { error: "Failed to create help request" },
      { status: 500 }
    );
  }
}
