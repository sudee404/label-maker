"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"
import { TrendingUp, Package, DollarSign, Clock, ArrowRight, Activity } from "lucide-react"

// Mock data for analytics
const shipmentData = [
  { month: "Jan", completed: 65, pending: 28 },
  { month: "Feb", completed: 78, pending: 32 },
  { month: "Mar", completed: 92, pending: 25 },
  { month: "Apr", completed: 105, pending: 20 },
  { month: "May", completed: 118, pending: 15 },
  { month: "Jun", completed: 142, pending: 12 },
]

const revenueData = [
  { week: "W1", revenue: 2400, forecast: 2200 },
  { week: "W2", revenue: 2810, forecast: 2400 },
  { week: "W3", revenue: 3200, forecast: 2800 },
  { week: "W4", revenue: 3890, forecast: 3300 },
  { week: "W5", revenue: 4200, forecast: 3900 },
]

const recentShipments = [
  { id: "SHP001", recipient: "John Smith", address: "123 Main St, NY", status: "Delivered", date: "2024-01-10" },
  { id: "SHP002", recipient: "Sarah Johnson", address: "456 Oak Ave, CA", status: "In Transit", date: "2024-01-09" },
  { id: "SHP003", recipient: "Mike Davis", address: "789 Pine Rd, TX", status: "Processing", date: "2024-01-08" },
  { id: "SHP004", recipient: "Emma Wilson", address: "321 Elm St, FL", status: "Pending", date: "2024-01-07" },
  { id: "SHP005", recipient: "Alex Brown", address: "654 Cedar Ln, WA", status: "Delivered", date: "2024-01-06" },
]

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState({
    totalShipments: 412,
    completedToday: 28,
    totalRevenue: 18540,
    averageValue: 45,
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  if (status === "loading") {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!session) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return "bg-green-500/10 text-green-700 dark:text-green-400"
      case "In Transit":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
      case "Processing":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400"
      case "Pending":
        return "bg-red-500/10 text-red-700 dark:text-red-400"
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400"
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {session?.user?.name || "User"}</p>
        </div>
        <Link href="/shipments/add">
          <Button className="gap-2 bg-accent hover:bg-accent/90">
            <Package className="w-4 h-4" />
            Create Shipment
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Shipments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-bold">{stats.totalShipments}</div>
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">+12% from last month</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-bold">{stats.completedToday}</div>
              <Activity className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">On pace for 150 this week</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-bold">${(stats.totalRevenue / 1000).toFixed(1)}k</div>
              <DollarSign className="w-5 h-5 text-accent" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">+8.5% growth rate</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-bold">${stats.averageValue}</div>
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per shipment</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="shipments" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="shipments">Shipment Trends</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="shipments">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Shipments Overview</CardTitle>
              <CardDescription>Monthly completed vs pending shipments</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={shipmentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
                  />
                  <Legend />
                  <Bar dataKey="completed" fill="var(--color-accent)" />
                  <Bar dataKey="pending" fill="var(--color-muted)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Revenue Forecast</CardTitle>
              <CardDescription>Weekly revenue vs forecast</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-accent)"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="var(--color-muted-foreground)"
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Activity */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Shipments</CardTitle>
            <CardDescription>Your latest shipment activity</CardDescription>
          </div>
          <Link href="/shipments">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentShipments.map((shipment) => (
              <div
                key={shipment.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-semibold text-primary">{shipment.id}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(shipment.status)}`}>
                      {shipment.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{shipment.recipient}</p>
                  <p className="text-xs text-muted-foreground">{shipment.address}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{shipment.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
