import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action }: { action: "accept" | "decline" } = await request.json();

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.contractorId) {
      return NextResponse.json({ error: "Project not assigned to contractor" }, { status: 400 });
    }

    let updates: Record<string, unknown> = {};
    if (action === "accept") {
      updates = {
        contractorStatus: "accepted",
        status: "CONTRACTOR_REVIEWING",
        currentStage: "ESTIMATE",
      };
    } else if (action === "decline") {
      updates = {
        contractorStatus: "declined",
        status: "REJECTED",
      };
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await prisma.project.update({ where: { id }, data: updates });
    return NextResponse.json({ message: "Contractor response saved" });
  } catch (error) {
    console.error("Error saving contractor response:", error);
    return NextResponse.json({ error: "Failed to save contractor response" }, { status: 500 });
  }
}


