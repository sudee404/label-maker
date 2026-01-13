import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function PUT(
  request: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const session = await getServerSession(authOptions as any)
    const { id } = await params // Await the params
    // Simulate updating shipment
    const updatedShipment = {
      id,
      ...body,
    }

    return NextResponse.json({ success: true, data: updatedShipment })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update shipment" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params // Await the params

    // Simulate deleting shipment
    return NextResponse.json({
      success: true,
      message: "Shipment deleted successfully",
      deletedId: id,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete shipment" }, { status: 500 })
  }
}
