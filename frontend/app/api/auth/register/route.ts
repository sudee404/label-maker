export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, name } = body

    if (!email || !password || !name) {
      return Response.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Call Django backend to register user
    const djangoResponse = await fetch("http://localhost:8000/api/register/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    })

    const djangoData = await djangoResponse.json()

    if (!djangoResponse.ok) {
      return Response.json({ message: djangoData.message || "Registration failed" }, { status: djangoResponse.status })
    }

    return Response.json({ message: "User registered successfully" }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}
