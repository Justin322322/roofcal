import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { UserRole } from "@/types/user-role";
import { notifyStatusChange } from "@/lib/notifications";

const reorderSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        status: z.enum([
          "DRAFT",
          "ACTIVE",
          "CLIENT_PENDING",
          "CONTRACTOR_REVIEWING",
          "PROPOSAL_SENT",
          "ACCEPTED",
          "IN_PROGRESS",
          "COMPLETED",
          "ARCHIVED",
          "REJECTED",
        ]),
        position: z.number().int().min(0),
      })
    )
    .min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const parse = reorderSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { items } = parse.data;
    const ids = items.map((i) => i.id);
    const projects = await prisma.project.findMany({
      where: { id: { in: ids } },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true } },
        contractor: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    const byId = new Map(projects.map((p) => [p.id, p]));

    const allowedTransitions: Record<string, string[]> = {
      DRAFT: ["CLIENT_PENDING"],
      CLIENT_PENDING: ["CONTRACTOR_REVIEWING"],
      CONTRACTOR_REVIEWING: ["PROPOSAL_SENT"],
      PROPOSAL_SENT: ["ACCEPTED", "REJECTED"],
      ACCEPTED: ["IN_PROGRESS"],
      IN_PROGRESS: ["COMPLETED"],
      COMPLETED: [],
      REJECTED: [],
      ACTIVE: ["IN_PROGRESS"],
      ARCHIVED: [],
    };

    for (const it of items) {
      const current = byId.get(it.id);
      if (!current) return NextResponse.json({ error: "Project not found" }, { status: 404 });

      // RBAC
      if (session.user.role === UserRole.CLIENT) {
        if (current.clientId !== session.user.id && current.userId !== session.user.id) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
        // Clients can only move from PROPOSAL_SENT -> ACCEPTED/REJECTED
        const from = current.status as string;
        if (from !== "PROPOSAL_SENT" || !["ACCEPTED", "REJECTED"].includes(it.status)) {
          return NextResponse.json({ error: "Invalid transition" }, { status: 400 });
        }
      } else if (session.user.role === UserRole.ADMIN) {
        if (current.contractorId !== session.user.id) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
        const from = current.status as string;
        if (!allowedTransitions[from]?.includes(it.status)) {
          return NextResponse.json({ error: "Invalid transition" }, { status: 400 });
        }
      }
    }

    const updatesData: { where: { id: string }; data: { status: undefined; boardPosition: number } }[] = [];
    const notify: Array<() => Promise<unknown>> = [];

    for (const it of items) {
      const current = byId.get(it.id)!;
      const statusChanged = (current.status as string) !== it.status;
      updatesData.push({
        where: { id: it.id },
        data: { status: it.status as unknown as undefined, boardPosition: it.position },
      });

      if (statusChanged) {
        const toNotify = session.user.role === UserRole.ADMIN ? current.client : current.contractor;
        if (toNotify) {
          notify.push(() =>
            notifyStatusChange(
              current.id,
              current.projectName,
              it.status,
              session.user.id,
              session.user.name || "User",
              toNotify.id,
              `${toNotify.firstName} ${toNotify.lastName}`,
              toNotify.email
            )
          );
        }
      }
    }

    await prisma.$transaction(updatesData.map((u) => prisma.project.update(u)));
    await Promise.allSettled(notify.map((fn) => fn()));

    return NextResponse.json({ message: "Reordered" });
  } catch (error) {
    console.error("Error reordering projects:", error);
    return NextResponse.json({ error: "Failed to reorder" }, { status: 500 });
  }
}


