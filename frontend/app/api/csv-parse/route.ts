import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.trim().split("\n")

    // Skip header rows (2 rows)
    const dataLines = lines.slice(2)
    const records = []

    for (const line of dataLines) {
      if (!line.trim()) continue

      const values = line.split(",").map((v) => v.trim())

      if (values.length < 23) continue

      // Parse CSV according to template structure
      const record = {
        id: `record-${Date.now()}-${Math.random()}`,
        shipFrom: {
          firstName: values[0] || "Print",
          lastName: values[1] || "TTS",
          address: values[2] || "502 W Arrow Hwy",
          address2: values[3] || "",
          city: values[4] || "San Dimas",
          zip: values[5] || "91773",
          state: values[6] || "CA",
          phone: values[19] || "",
        },
        shipTo: {
          firstName: values[7] || "",
          lastName: values[8] || "",
          address: values[9] || "",
          address2: values[10] || "",
          city: values[11] || "",
          zip: values[12] || "",
          state: values[13] || "",
          phone: values[20] || "",
        },
        package: {
          lbs: Number.parseInt(values[14]) || 0,
          oz: Number.parseInt(values[15]) || 0,
          length: Number.parseInt(values[16]) || 0,
          width: Number.parseInt(values[17]) || 0,
          height: Number.parseInt(values[18]) || 0,
          sku: values[22] || "",
        },
        orderNo: values[21] || "",
        shippingService: "ground",
        shippingPrice: 5.99,
      }

      records.push(record)
    }

    return NextResponse.json({
      success: true,
      data: records,
      count: records.length,
    })
  } catch (error) {
    console.error("CSV parse error:", error)
    return NextResponse.json({ success: false, error: "Failed to parse CSV file" }, { status: 500 })
  }
}
