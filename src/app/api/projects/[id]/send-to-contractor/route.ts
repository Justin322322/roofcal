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
    
    console.log('Found project:', {
      id: project.id,
      name: project.projectName,
      currentStatus: project.status,
      currentContractorId: project.contractorId,
      userId: project.userId
    });

    const contractor = await prisma.user.findUnique({ where: { id: contractorId } });
    if (!contractor) {
      return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
    }

    // Update project handoff fields - set to CONTRACTOR_REVIEWING so contractor can accept/decline immediately
    console.log('Before update - Project ID:', id, 'Contractor ID:', contractorId);
    console.log('Current project status:', project.status);
    
    // Use a transaction to ensure the update is committed
    const updated = await prisma.$transaction(async (tx) => {
      return await tx.project.update({
        where: { id },
        data: {
          contractorId,
          sentToContractorAt: new Date(),
          contractorStatus: "reviewing",
          status: "CONTRACTOR_REVIEWING",
          handoffNote: note,
        },
      });
    });
    
    console.log('After update - Project status:', updated.status, 'Contractor ID:', updated.contractorId);

    // Verify the update by querying the database again
    const verification = await prisma.project.findUnique({
      where: { id },
      select: { id: true, status: true, contractorId: true }
    });
    console.log('Verification query result:', verification);

    // Revalidate paths to refresh project lists
    revalidatePath("/dashboard");
    revalidatePath("/dashboard?tab=projects");
    revalidatePath("/dashboard?tab=roof-calculator");
    revalidatePath("/api/projects");

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

    const response = { 
      success: true,
      message: "Sent to contractor",
      project: {
        id: updated.id,
        status: updated.status,
        contractorId: updated.contractorId
      }
    };
    
    console.log('API Response:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error sending to contractor:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: "Failed to send to contractor",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}


