import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";
import { notifyQuoteRequested } from "@/lib/notifications";
import { revalidatePath } from "next/cache";

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
    const { contractorId, note }: { contractorId: string; note?: string } = await request.json();

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const contractor = await prisma.user.findUnique({ where: { id: contractorId } });
    if (!contractor) {
      return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
    }

    // Update project handoff fields - set to CONTRACTOR_REVIEWING so contractor can accept/decline immediately
    const updated = await prisma.project.update({
      where: { id },
      data: {
        contractorId,
        sentToContractorAt: new Date(),
        contractorStatus: "reviewing",
        status: "CONTRACTOR_REVIEWING",
        handoffNote: note,
      },
    });

    // Revalidate paths to refresh project lists
    revalidatePath("/dashboard");
    revalidatePath("/dashboard?tab=projects");
    revalidatePath("/dashboard?tab=roof-calculator");

    // In-app notification
    await notifyQuoteRequested(
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


