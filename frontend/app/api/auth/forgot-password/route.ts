export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email) {
      return Response.json({ message: "Email is required" }, { status: 400 })
    }

    // Call Django backend to initiate password recovery
    const djangoResponse = await fetch("http://localhost:8000/api/forgot-password/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })

    const djangoData = await djangoResponse.json()

    if (!djangoResponse.ok) {
      return Response.json(
        { message: djangoData.message || "Failed to send recovery email" },
        { status: djangoResponse.status },
      )
    }

    return Response.json({ message: "Recovery email sent" }, { status: 200 })
  } catch (error) {
    console.error("Password recovery error:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}
