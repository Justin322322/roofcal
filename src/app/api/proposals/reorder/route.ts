import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { UserRole } from "@/types/user-role";
import { notifyProposalAccepted, notifyProposalRejected, notifyProposalSent } from "@/lib/notifications";

const reorderSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED", "REVISED", "COMPLETED"]),
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

    // Load current records for RBAC and transition checks
    const ids = items.map((i) => i.id);
    const projects = await prisma.project.findMany({
      where: { id: { in: ids } },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true } },
        contractor: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    // Build a map for quick lookup
    const byId = new Map(projects.map((p) => [p.id, p]));

    // RBAC and transition validation
    const canClientSet = (from: string | null, to: string) => {
      if (from === "ACCEPTED" || from === "REJECTED" || from === "COMPLETED") return false;
      // Client may accept/reject only from SENT or REVISED
      if ((to === "ACCEPTED" || to === "REJECTED") && (from === "SENT" || from === "REVISED")) return true;
      // Otherwise not allowed
      return false;
    };

    const canAdminSet = (from: string | null, to: string) => {
      if (from === "COMPLETED") return false;
      // Admin can move from DRAFT -> SENT/REVISED, REJECTED -> SENT/REVISED, SENT/REVISED -> (no change here; accept/reject is client)
      if (to === "SENT" || to === "REVISED") return true;
      // Admin cannot set ACCEPTED/REJECTED via drag; must be via explicit endpoints
      if (to === "ACCEPTED" || to === "REJECTED") return false;
      // Allow staying in DRAFT/COMPLETED same
      return to === (from || "DRAFT");
    };

    for (const it of items) {
      const current = byId.get(it.id);
      if (!current) return NextResponse.json({ error: "Project not found" }, { status: 404 });

      // Ownership checks
      if (session.user.role === UserRole.CLIENT) {
        if (current.clientId !== session.user.id && current.userId !== session.user.id) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
        if (!canClientSet(current.proposalStatus ?? null, it.status)) {
          return NextResponse.json({ error: "Invalid transition" }, { status: 400 });
        }
      } else if (session.user.role === UserRole.ADMIN) {
        if (current.contractorId !== session.user.id) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
        if (!canAdminSet(current.proposalStatus ?? null, it.status)) {
          return NextResponse.json({ error: "Invalid transition" }, { status: 400 });
        }
      }
    }

    // Prepare updates and notifications
    const updatesData: { where: { id: string }; data: { proposalStatus: undefined; proposalPosition: number } }[] = [];
    const notify: Array<() => Promise<unknown>> = [];

    for (const it of items) {
      const current = byId.get(it.id)!;
      const statusChanged = (current.proposalStatus || "DRAFT") !== it.status;
      updatesData.push({
        where: { id: it.id },
        // Casting to 'undefined' is needed to satisfy Prisma enum type at compile-time while passing a string literal
        data: { proposalStatus: it.status as unknown as undefined, proposalPosition: it.position },
      });

      if (statusChanged) {
        // Fire appropriate notification based on new status
        if (it.status === "SENT" || it.status === "REVISED") {
          const cl = current.client;
          if (cl) {
            notify.push(() =>
              notifyProposalSent(
                current.id,
                current.projectName,
                session.user.id,
                session.user.name || "Contractor",
                cl.id,
                `${cl.firstName} ${cl.lastName}`,
                cl.email
              )
            );
          }
        } else if (it.status === "ACCEPTED") {
          const ct = current.contractor;
          if (ct) {
            notify.push(() =>
              notifyProposalAccepted(
                current.id,
                current.projectName,
                session.user.id,
                session.user.name || "User",
                ct.id,
                `${ct.firstName} ${ct.lastName}`,
                ct.email
              )
            );
          }
        } else if (it.status === "REJECTED") {
          const ct = current.contractor;
          if (ct) {
            notify.push(() =>
              notifyProposalRejected(
                current.id,
                current.projectName,
                session.user.id,
                session.user.name || "User",
                ct.id,
                `${ct.firstName} ${ct.lastName}`,
                ct.email
              )
            );
          }
        }
      }
    }

    await prisma.$transaction(updatesData.map((u) => prisma.project.update(u)));

    // Send notifications in background (best effort)
    await Promise.allSettled(notify.map((fn) => fn()));

    return NextResponse.json({ message: "Reordered" });
  } catch (error) {
    console.error("Error reordering proposals:", error);
    return NextResponse.json({ error: "Failed to reorder" }, { status: 500 });
  }
}


