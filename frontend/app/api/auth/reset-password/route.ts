export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token, password } = body

    if (!token || !password) {
      return Response.json({ message: "Token and password are required" }, { status: 400 })
    }

    // Call Django backend to reset password
    const djangoResponse = await fetch("http://localhost:8000/api/reset-password/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    })

    const djangoData = await djangoResponse.json()

    if (!djangoResponse.ok) {
      return Response.json(
        { message: djangoData.message || "Failed to reset password" },
        { status: djangoResponse.status },
      )
    }

    return Response.json({ message: "Password reset successfully" }, { status: 200 })
  } catch (error) {
    console.error("Password reset error:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}
