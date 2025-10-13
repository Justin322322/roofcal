import { prisma } from "@/lib/prisma";
import { verifyHandoffToken } from "@/lib/handoff-token";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ action?: string }>;
}

export default async function ContractorProjectHandoffPage(props: PageProps) {
  const { token } = await props.params;
  const { action } = await props.searchParams;

  const decoded = verifyHandoffToken(token);
  if (!decoded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Invalid or Expired Link</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">This handoff link is invalid or has expired.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const project = await prisma.project.findUnique({ where: { id: decoded.projectId } });
  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Project Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">We could not find the project associated with this link.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  let message = "";
  if (action === "accept") {
    await prisma.project.update({
      where: { id: project.id },
      data: { contractorStatus: "accepted", status: "CONTRACTOR_REVIEWING", currentStage: "ESTIMATE" as any },
    });
    message = "You have accepted this project. It is now marked for review.";
  } else if (action === "decline") {
    await prisma.project.update({
      where: { id: project.id },
      data: { contractorStatus: "declined", status: "REJECTED" },
    });
    message = "You have declined this project.";
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Project Handoff</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm">Project: <span className="font-medium">{project.projectName}</span></p>
          </div>
          {message ? (
            <p className="text-sm text-muted-foreground">{message}</p>
          ) : (
            <div className="flex gap-2">
              <Link href={`/contractor/projects/${token}?action=accept`}>
                <Button size="sm" className="bg-green-600 hover:bg-green-700">Accept</Button>
              </Link>
              <Link href={`/contractor/projects/${token}?action=decline`}>
                <Button size="sm" variant="destructive">Decline</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


