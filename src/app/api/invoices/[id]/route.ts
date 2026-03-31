import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { status } = body;

  try {
    const invoice = await prisma.invoice.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Update error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
