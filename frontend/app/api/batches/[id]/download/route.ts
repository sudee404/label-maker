import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import api from "@/lib/axios";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {  // adjust depending on your session shape
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Forward the request to Django backend
    // Important: we want the raw binary response (PDF)
    const response = await api.get(`/core/batches/${id}/labels/`, {
      responseType: "arraybuffer", // crucial for binary data (PDF)
      headers: {
        // Make sure token is sent if your axios instance doesn't handle it automatically
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    // Create filename (optional but nice)
    const filename = `shipping-labels-batch-${id}.pdf`;

    // Return the PDF as a downloadable response
    return new NextResponse(response.data, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": response.headers["content-length"] || undefined,
      },
    });
  } catch (error: any) {
    console.error("Labels download error:", error?.response?.data || error);

    if (error?.response?.status === 400 || error?.response?.status === 404) {
      return NextResponse.json(
        {
          success: false,
          error: error?.response?.data?.detail || "Cannot download labels yet",
        },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to download labels" },
      { status: 500 }
    );
  }
}