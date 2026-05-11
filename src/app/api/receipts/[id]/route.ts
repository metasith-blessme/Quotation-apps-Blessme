import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { receiptStatusUpdateSchema } from "@/lib/validations/receipt.schema";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const validated = receiptStatusUpdateSchema.parse(body);

    const receipt = await prisma.receipt.findUnique({
      where: { id },
    });

    if (!receipt) return new NextResponse("Receipt not found", { status: 404 });

    // Access control
    const isAdmin = session.user.role === "ADMIN";
    const isOwner = receipt.createdById === session.user.id;
    if (!isAdmin && !isOwner) return new NextResponse("Forbidden", { status: 403 });

    const updated = await prisma.receipt.update({
      where: { id },
      data: { status: validated.status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update receipt status error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;

  try {
    const receipt = await prisma.receipt.findUnique({
      where: { id },
    });

    if (!receipt) return new NextResponse("Receipt not found", { status: 404 });

    // Access control: only ADMIN can delete
    if (session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    await prisma.receipt.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Delete receipt error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
