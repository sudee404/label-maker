import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"

const DJANGO_API_URL = process.env.DJANGO_API_URL || "http://localhost:8000/api"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions as any)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Forward the file to Django
    const djangoFormData = new FormData()
    djangoFormData.append("file", file)

    const response = await fetch(`${DJANGO_API_URL}/bulk-upload/`, {
      method: "POST",
      body: djangoFormData,
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
