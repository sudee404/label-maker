"use client"

import { useState } from "react"
import { ShipmentForm } from "@/components/shipment-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ShipmentsPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Shipments</h1>
        <p className="text-muted-foreground mt-2">Manage and track all your bulk shipments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ShipmentForm onSuccess={() => setRefreshTrigger((prev) => prev + 1)} />
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Shipments</CardTitle>
              <CardDescription>View and manage all your active shipments</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="active" className="w-full">
                <TabsList>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="delivered">Delivered</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No active shipments</p>
                    <p className="text-sm">Create your first shipment using the form</p>
                  </div>
                </TabsContent>

                <TabsContent value="delivered" className="space-y-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No delivered shipments</p>
                  </div>
                </TabsContent>

                <TabsContent value="all" className="space-y-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No shipments yet</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
