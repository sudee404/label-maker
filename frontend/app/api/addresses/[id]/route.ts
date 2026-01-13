import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import api from "@/lib/axios";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing shipment id" }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const data = await request.json();

    const response = await api.post(
      `/core/shipments/${id}/upsert-address/`,
      data
    );
    const result = response.data;
    return NextResponse.json({ success: false, data: result });
  } catch (error: any) {
    console.error("Upsert Error:", error);

    const status = error.response?.status || 500;
    const message =
      error.response?.data?.error ||
      error.response?.data?.detail ||
      error.message ||
      "Internal server error during upload";

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
