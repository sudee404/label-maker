import { type NextRequest, NextResponse } from "next/server"

// Sample data that would come from a database
const generateSampleShipments = () => {
  const sampleRecipients = [
    { name: "Salina Dixon", address: "61 Sunny Trail Rd", city: "Wallace", state: "NC", zip: "28466" },
    { name: "Layth Cheffan", address: "1345 Sw 163Rd Ave", city: "Beaverton", state: "OR", zip: "97006" },
    { name: "James Maloney", address: "45-995 Wailele Rd", city: "Kaneohe", state: "HI", zip: "96744" },
    { name: "Howard Rogers", address: "2300 Repsdorph Rd", city: "Seabrook", state: "TX", zip: "77586" },
    { name: "Kawaun Doyle", address: "3101 Hickory Hill Dr", city: "Dothan", state: "AL", zip: "36303" },
  ]

  const shipments = []
  for (let i = 0; i < 5; i++) {
    const recipient = sampleRecipients[i % sampleRecipients.length]
    shipments.push({
      id: `ship-${i + 1}`,
      shipFrom: {
        firstName: "Print",
        lastName: "TTS",
        address: "502 W Arrow Hwy, STE P",
        address2: "",
        city: "San Dimas",
        zip: "91773",
        state: "CA",
        phone: "(626) 555-0100",
      },
      shipTo: {
        firstName: recipient.name.split(" ")[0],
        lastName: recipient.name.split(" ")[1] || "",
        address: recipient.address,
        address2: `Apt ${100 + i}`,
        city: recipient.city,
        zip: recipient.zip,
        state: recipient.state,
        phone: "(555) 123-4567",
      },
      package: {
        length: 12,
        width: 8,
        height: 6,
        lbs: 2,
        oz: 4,
        sku: `SKU-${1000 + i}`,
      },
      orderNo: `ORD-${100000 + i}`,
      shippingService: "ground",
      shippingPrice: 5.99,
    })
  }
  return shipments
}

export async function GET(request: NextRequest) {
  try {
    const shipments = generateSampleShipments()
    return NextResponse.json({
      success: true,
      data: shipments,
      count: shipments.length,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch shipments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate the shipment data
    if (!body.shipFrom || !body.shipTo || !body.package) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Create new shipment with ID
    const newShipment = {
      id: `ship-${Date.now()}`,
      ...body,
      shippingService: body.shippingService || "ground",
      shippingPrice: body.shippingPrice || 5.99,
    }

    return NextResponse.json({ success: true, data: newShipment }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create shipment" }, { status: 500 })
  }
}
