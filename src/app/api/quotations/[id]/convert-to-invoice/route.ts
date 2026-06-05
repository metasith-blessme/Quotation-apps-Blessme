import { auth } from "@/lib/auth";
import { convertQuotationToInvoice } from "@/lib/document-lifecycle";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const userId = session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  try {
    const result = await convertQuotationToInvoice(id, userId, isAdmin);

    if (!result.success) {
      if (result.error === "NOT_FOUND") {
        return new NextResponse(result.message, { status: 404 });
      }
      if (result.error === "FORBIDDEN") {
        return new NextResponse(result.message, { status: 403 });
      }
      return new NextResponse(result.message, { status: 500 });
    }

    return NextResponse.json(result.data, { status: result.alreadyExisted ? 200 : 201 });
  } catch (error) {
    console.error("Conversion API error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
