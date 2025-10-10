import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(8),
});

export async function POST(req: Request) {
  const body = await req.json();
  const { email, newPassword } = schema.parse(body);

  // Check if user exists
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json(
      { error: "No account found with this email address" },
      { status: 404 }
    );
  }

  // Update user password
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { email },
    data: { passwordHash },
  });

  return new NextResponse(null, { status: 204 });
}
