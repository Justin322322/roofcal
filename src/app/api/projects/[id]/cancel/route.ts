import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";
import { sendCustomEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(
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
    const { reason }: { reason?: string } = await request.json();

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        user_project_clientIdTouser: true,
        user_project_contractorIdTouser: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user is either the client or the contractor
    const isClient = project.clientId === session.user.id;
    const isContractor = project.contractorId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isClient && !isContractor && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Only allow cancellation for CONTRACTOR_REVIEWING, ACCEPTED or IN_PROGRESS projects
    if (
      project.status !== "CONTRACTOR_REVIEWING" &&
      project.status !== "ACCEPTED" &&
      project.status !== "IN_PROGRESS"
    ) {
      return NextResponse.json(
        {
          error:
            "Only projects under review, accepted, or in-progress can be cancelled",
        },
        { status: 400 }
      );
    }

    // Determine who is cancelling
    const cancelledBy = isClient ? "client" : "contractor";
    const cancelledByName = isClient
      ? `${project.user_project_clientIdTouser?.firstName} ${project.user_project_clientIdTouser?.lastName}`
      : `${project.user_project_contractorIdTouser?.firstName} ${project.user_project_contractorIdTouser?.lastName}`;

    // Update project status to CANCELLED
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        status: "CANCELLED",
        // Keep the existing proposalStatus, don't change it to REJECTED
        // This ensures the badge shows "CANCELLED" not "REJECTED"
        notes: reason
          ? `${project.notes ? project.notes + "\n\n" : ""}Cancelled by ${cancelledBy} (${cancelledByName}): ${reason}`
          : `${project.notes ? project.notes + "\n\n" : ""}Cancelled by ${cancelledBy} (${cancelledByName})`,
      },
    });

    // Send notifications to the other party
    if (isClient && project.user_project_contractorIdTouser) {
      // Client cancelled - notify contractor
      const contractor = project.user_project_contractorIdTouser;

      try {
        await sendCustomEmail(
          contractor.email,
          `Project Cancelled: ${updatedProject.projectName}`,
          {
            title: "Project Cancelled",
            heading: "Project Cancelled by Client",
            content: `
              <p>The client has cancelled the project "<strong>${updatedProject.projectName}</strong>".</p>
              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
              <p>The project has been marked as cancelled and no further work is required.</p>
            `,
            actionContent: `
              <div style="text-align: center; margin: 32px 0;">
                <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard?tab=contractor-projects" style="display: inline-block; background: #16a34a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                  View Projects
                </a>
              </div>
            `,
            securityNotice:
              "If you have any questions, please contact the client or our support team.",
          },
          `Project "${updatedProject.projectName}" has been cancelled by the client. ${reason ? `Reason: ${reason}` : ""}`
        );

        // Create in-app notification
        await prisma.notification.create({
          data: {
            id: crypto.randomUUID(),
            userId: contractor.id,
            type: "PROJECT_CANCELLED",
            title: "Project Cancelled by Client",
            message: `${project.projectName} has been cancelled by ${cancelledByName}.${reason ? ` Reason: ${reason}` : ""}`,
            projectId: project.id,
            projectName: project.projectName,
            actionUrl: `/dashboard?tab=contractor-projects`,
            read: false,
            created_at: new Date(),
          },
        });
      } catch (notificationError) {
        console.error(
          "Failed to send cancellation notification:",
          notificationError
        );
      }
    } else if (isContractor && project.user_project_clientIdTouser) {
      // Contractor cancelled - notify client
      const client = project.user_project_clientIdTouser;

      try {
        await sendCustomEmail(
          client.email,
          `Project Cancelled: ${updatedProject.projectName}`,
          {
            title: "Project Cancelled",
            heading: "Project Cancelled by Contractor",
            content: `
              <p>The contractor has cancelled your project "<strong>${updatedProject.projectName}</strong>".</p>
              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
              <p>The project has been marked as cancelled. You may want to contact another contractor or review your project details.</p>
            `,
            actionContent: `
              <div style="text-align: center; margin: 32px 0;">
                <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard?tab=my-projects" style="display: inline-block; background: #16a34a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                  View My Projects
                </a>
              </div>
            `,
            securityNotice:
              "If you have any questions, please contact our support team.",
          },
          `Your project "${updatedProject.projectName}" has been cancelled by the contractor. ${reason ? `Reason: ${reason}` : ""}`
        );

        // Create in-app notification
        await prisma.notification.create({
          data: {
            id: crypto.randomUUID(),
            userId: client.id,
            type: "PROJECT_CANCELLED",
            title: "Project Cancelled by Contractor",
            message: `${project.projectName} has been cancelled by ${cancelledByName}.${reason ? ` Reason: ${reason}` : ""}`,
            projectId: project.id,
            projectName: project.projectName,
            actionUrl: `/dashboard?tab=my-projects`,
            read: false,
            created_at: new Date(),
          },
        });
      } catch (notificationError) {
        console.error(
          "Failed to send cancellation notification:",
          notificationError
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Project cancelled successfully",
      project: updatedProject,
    });
  } catch (error) {
    console.error("Error cancelling project:", error);
    return NextResponse.json(
      { error: "Failed to cancel project" },
      { status: 500 }
    );
  }
}
