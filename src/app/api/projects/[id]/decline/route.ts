import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";
import { sendCustomEmail } from "@/lib/email";

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const { reason }: { reason?: string } = await request.json();

    const project = await prisma.project.findUnique({ 
      where: { id },
      include: { user_project_clientIdTouser: true }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user is the assigned contractor
    if (project.contractorId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update project status to REJECTED
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        status: "REJECTED",
        contractorStatus: "declined",
        notes: reason ? `${project.notes ? project.notes + '\n\n' : ''}Declined: ${reason}` : project.notes,
      },
    });

    // Send email to client notifying them of the rejection
    if (project.user_project_clientIdTouser) {
      const client = project.user_project_clientIdTouser;
      
      try {
        await sendCustomEmail(
          client.email,
          `Project Declined: ${updatedProject.projectName}`,
          {
            title: "Project Declined",
            heading: "Project Declined",
            content: `
              <p>We regret to inform you that the contractor has declined your project "<strong>${updatedProject.projectName}</strong>".</p>
              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
              <p>Your project has been marked as declined. You may want to contact another contractor or review your project details.</p>
            `,
            actionContent: `
              <div style="text-align: center; margin: 32px 0;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard?tab=my-projects" style="display: inline-block; background: #16a34a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                  View My Projects
                </a>
              </div>
            `,
            securityNotice: "If you have any questions, please contact our support team.",
          },
          `Your project "${updatedProject.projectName}" has been declined by the contractor. ${reason ? `Reason: ${reason}` : ''}`
        );
      } catch (emailError) {
        console.error("Failed to send rejection email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Project declined",
      project: updatedProject 
    });
  } catch (error) {
    console.error("Error declining project:", error);
    return NextResponse.json({ error: "Failed to decline project" }, { status: 500 });
  }
}

