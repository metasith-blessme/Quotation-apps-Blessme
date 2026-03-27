import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const company = await prisma.company.findFirst();
  return NextResponse.json(company);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const company = await prisma.company.findFirst();

  if (company) {
    const updated = await prisma.company.update({
      where: { id: company.id },
      data: {
        nameTh: body.nameTh,
        nameEn: body.nameEn,
        address: body.address,
        taxId: body.taxId,
        phone: body.phone,
        email: body.email,
        logoPath: body.logoPath,
        termsText: body.termsText,
      },
    });
    return NextResponse.json(updated);
  }

  const created = await prisma.company.create({ data: body });
  return NextResponse.json(created);
}
