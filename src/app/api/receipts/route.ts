import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const isAdmin = session.user.role === "ADMIN";

  try {
    const receipts = await prisma.receipt.findMany({
      where: {
        ...(status && status !== "ALL" ? { status } : {}),
        ...(!isAdmin ? { createdById: session.user.id } : {}),
      },
      include: {
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const counts = {
      total: await prisma.receipt.count({
        where: !isAdmin ? { createdById: session.user.id } : {},
      }),
      completed: await prisma.receipt.count({
        where: {
          status: "COMPLETED",
          ...(!isAdmin ? { createdById: session.user.id } : {}),
        },
      }),
      cancelled: await prisma.receipt.count({
        where: {
          status: "CANCELLED",
          ...(!isAdmin ? { createdById: session.user.id } : {}),
        },
      }),
    };

    return NextResponse.json({ receipts, counts });
  } catch (error) {
    console.error("Fetch receipts error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
