import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";
import { generateHandoffToken } from "@/lib/handoff-token";
import { sendCustomEmail } from "@/lib/email";
import { notifyProjectAssigned } from "@/lib/notifications";

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
    const { contractorId, note }: { contractorId: string; note?: string } = await request.json();

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const contractor = await prisma.user.findUnique({ where: { id: contractorId } });
    if (!contractor) {
      return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
    }

    // Update project handoff fields
    const updated = await prisma.project.update({
      where: { id },
      data: {
        contractorId,
        sentToContractorAt: new Date(),
        contractorStatus: "pending",
        status: "CLIENT_PENDING",
        handoffNote: note,
      },
    });

    // Generate handoff token and email contractor
    const token = generateHandoffToken(id, contractorId);
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const acceptUrl = `${baseUrl}/contractor/projects/${token}?action=accept`;
    const declineUrl = `${baseUrl}/contractor/projects/${token}?action=decline`;

    await sendCustomEmail(
      contractor.email,
      `Project Ready for Review: ${updated.projectName}`,
      {
        title: "Project Ready for Review",
        heading: "Project Ready for Review",
        content: `A new project "${updated.projectName}" is ready for your review. ${note ? `<br/><br/><strong>Note:</strong> ${note}` : ""}`,
        actionContent: `
          <div style="text-align: center; margin: 32px 0;">
            <a href="${acceptUrl}" style="display: inline-block; background: #16a34a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-right: 12px;">
              Accept
            </a>
            <a href="${declineUrl}" style="display: inline-block; background: #dc2626; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
              Decline
            </a>
          </div>
        `,
        securityNotice: "This link will expire in 7 days.",
      },
      `A new project "${updated.projectName}" is ready for your review. Accept: ${acceptUrl} Decline: ${declineUrl}`
    );

    // In-app notification
    await notifyProjectAssigned(
      updated.id,
      updated.projectName,
      session.user.id,
      session.user.name || session.user.email!,
      contractor.id,
      `${contractor.firstName || ""} ${contractor.lastName || ""}`.trim() || contractor.email,
      contractor.email
    );

    return NextResponse.json({ message: "Sent to contractor" });
  } catch (error) {
    console.error("Error sending to contractor:", error);
    return NextResponse.json({ error: "Failed to send to contractor" }, { status: 500 });
  }
}


