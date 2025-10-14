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
    const { message } = body;

    // Get all active ADMIN users (contractors) to notify
    const adminUsers = await prisma.user.findMany({
      where: {
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

    if (adminUsers.length === 0) {
      return NextResponse.json(
        { error: "No contractors available to help" },
        { status: 503 }
      );
    }

    // Create notifications for all admin users
    const notifications = await Promise.all(
      adminUsers.map((admin) =>
        prisma.notification.create({
          data: {
            id: crypto.randomUUID(),
            userId: admin.id,
            type: "HELP_REQUEST",
            title: "Client Needs Help",
            message: `${session.user.name} (${session.user.email}) needs assistance with creating a project${message ? `: "${message}"` : ""}`,
            projectId: null,
            projectName: null,
            actionUrl: `/dashboard?tab=roof-calculator&helpRequest=true&clientId=${session.user.id}`,
            read: false,
            created_at: new Date(),
          },
        })
      )
    );

    console.log(`Help request notifications sent to ${adminUsers.length} contractors for client ${session.user.id}`);

    return NextResponse.json({
      success: true,
      message: "Help request sent successfully",
      notificationsSent: notifications.length,
    });
  } catch (error) {
    console.error("Error creating help request:", error);
    return NextResponse.json(
      { error: "Failed to create help request" },
      { status: 500 }
    );
  }
}
