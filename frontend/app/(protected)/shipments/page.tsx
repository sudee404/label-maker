"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Eye } from "lucide-react"
import Link from "next/link"

const allShipments = [
  {
    id: "SHP001",
    orderNumber: "ORD-2024-001",
    recipient: "John Smith",
    address: "123 Main St, New York, NY 10001",
    status: "Delivered",
    service: "Priority Mail",
    price: "$8.50",
    date: "2024-01-10",
  },
  {
    id: "SHP002",
    orderNumber: "ORD-2024-002",
    recipient: "Sarah Johnson",
    address: "456 Oak Ave, Los Angeles, CA 90001",
    status: "In Transit",
    service: "Ground",
    price: "$4.25",
    date: "2024-01-09",
  },
  {
    id: "SHP003",
    orderNumber: "ORD-2024-003",
    recipient: "Mike Davis",
    address: "789 Pine Rd, Houston, TX 77001",
    status: "Processing",
    service: "Priority Mail",
    price: "$7.99",
    date: "2024-01-08",
  },
  {
    id: "SHP004",
    orderNumber: "ORD-2024-004",
    recipient: "Emma Wilson",
    address: "321 Elm St, Miami, FL 33101",
    status: "Pending",
    service: "Ground",
    price: "$3.50",
    date: "2024-01-07",
  },
  {
    id: "SHP005",
    orderNumber: "ORD-2024-005",
    recipient: "Alex Brown",
    address: "654 Cedar Ln, Seattle, WA 98101",
    status: "Delivered",
    service: "Priority Mail",
    price: "$9.75",
    date: "2024-01-06",
  },
]

export default function ShipmentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (status === "loading") {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!session) return null

  const filteredShipments = allShipments.filter((shipment) => {
    const matchesSearch =
      shipment.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === "all" || shipment.status.toLowerCase() === filterStatus.toLowerCase()

    return matchesSearch && matchesStatus
  })

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shipments</h1>
          <p className="text-muted-foreground">Manage and track all your shipments</p>
        </div>
        <Link href="/shipments/add">
          <Button className="bg-accent hover:bg-accent/90">Create New Shipment</Button>
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by recipient, order number, or shipment ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-full md:w-auto">
          <TabsList className="bg-muted/50 w-full md:w-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="delivered">Delivered</TabsTrigger>
            <TabsTrigger value="in transit">In Transit</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>All Shipments</CardTitle>
          <CardDescription>{filteredShipments.length} shipments found</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredShipments.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Order #</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-mono text-sm font-semibold text-primary">{shipment.id}</TableCell>
                      <TableCell className="font-mono text-sm">{shipment.orderNumber}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{shipment.recipient}</p>
                          <p className="text-sm text-muted-foreground">{shipment.address}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{shipment.service}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(shipment.status)}>{shipment.status}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">{shipment.price}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{shipment.date}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No shipments found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
