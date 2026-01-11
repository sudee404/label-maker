"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Package, Truck, AlertCircle } from "lucide-react"

export default function DashboardPage() {
  const { data: session } = useSession()

  const stats = [
    { label: "Active Shipments", value: "12", icon: Package, color: "text-orange-500" },
    { label: "In Transit", value: "5", icon: Truck, color: "text-blue-500" },
    { label: "Delivered", value: "47", icon: BarChart3, color: "text-green-500" },
    { label: "Issues", value: "1", icon: AlertCircle, color: "text-red-500" },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {session?.user?.name}</h1>
        <p className="text-muted-foreground mt-2">Here{"'"}s an overview of your shipping operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  {stat.label}
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest shipment activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Shipment #SH-2024-001</p>
                <p className="text-sm text-muted-foreground">New York → Los Angeles</p>
              </div>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">In Transit</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Shipment #SH-2024-002</p>
                <p className="text-sm text-muted-foreground">Chicago → Miami</p>
              </div>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Pending</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
