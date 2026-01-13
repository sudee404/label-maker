import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import api from "@/lib/axios";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const session = await getServerSession(authOptions as any);

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const response = await api.post(`/core/batches/${id}/bulk-update/`, body);
    const result = response.data;

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update shipment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { id } = await params;

    await api.delete(`/core/shipments/${id}/`);

    return NextResponse.json({
      success: true,
      message: "Shipment deleted successfully",
      deletedId: id,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete shipment" },
      { status: 500 }
    );
  }
}
