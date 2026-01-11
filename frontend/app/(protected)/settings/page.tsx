"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function SettingsPage() {
  const { data: session } = useSession()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" value={session?.user?.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input type="text" value={session?.user?.name || ""} disabled />
            </div>
            <Button disabled>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Preferences</CardTitle>
            <CardDescription>Configure your notification and display preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Email Notifications</label>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">SMS Notifications</label>
              <input type="checkbox" className="w-4 h-4" />
            </div>
            <Button disabled>Save Preferences</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
