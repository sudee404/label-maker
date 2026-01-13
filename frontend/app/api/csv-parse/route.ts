import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import api from "@/lib/axios";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { success: false, error: "No valid CSV file provided" },
        { status: 400 }
      );
    }

    const djangoFormData = new FormData();
    djangoFormData.append("file", file);

    const response = await api.post("/core/upload/", djangoFormData);
    const result = response.data;

    return NextResponse.json({
      success: true,
      batch_id: result.batch_id,
      total_records: result.total_records ?? result.record_count ?? 0,
      issues: result.issues ?? 0,
      preview: result.preview ?? [],
      message: "Upload successful",
    });
  } catch (error: any) {
    console.error("[Upload CSV Proxy] Error:", error);

    const status = error.response?.status || 500;
    const message =
      error.response?.data?.error ||
      error.response?.data?.detail ||
      error.message ||
      "Internal server error during upload";

    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}