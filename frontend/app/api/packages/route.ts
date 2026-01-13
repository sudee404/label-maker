import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import api from "@/lib/axios";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const response = await api.get("/core/packages/", {
      params: searchParams,
    });
    const result = response.data;

    return NextResponse.json({ success: false, data: result });
  } catch (error: any) {
    console.error("Fetching Error:", error);

    const status = error.response?.status || 500;
    const message =
      error.response?.data?.error ||
      error.response?.data?.detail ||
      error.message ||
      "Internal server error during upload";

    return NextResponse.json({ success: false, error: message }, { status });
  }
}

