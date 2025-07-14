"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Palette, Monitor, Sun, Moon } from "lucide-react"

export default function AppearancePage() {
  const { theme, setTheme } = useTheme()
  const [sidebarWidth, setSidebarWidth] = useState([280])
  const [fontSize, setFontSize] = useState([14])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Appearance</h1>
        <p className="text-muted-foreground">
          Customize the look and feel of your dashboard
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Theme Settings
            </CardTitle>
            <CardDescription>
              Choose how your dashboard looks and feels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Color Theme</Label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setTheme("light")}
                >
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setTheme("dark")}
                >
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setTheme("system")}
                >
                  <Monitor className="mr-2 h-4 w-4" />
                  System
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Accent Color</Label>
              <div className="grid grid-cols-6 gap-2">
                {[
                  { name: "Blue", class: "bg-blue-500" },
                  { name: "Green", class: "bg-green-500" },
                  { name: "Purple", class: "bg-purple-500" },
                  { name: "Orange", class: "bg-orange-500" },
                  { name: "Red", class: "bg-red-500" },
                  { name: "Pink", class: "bg-pink-500" },
                ].map((color) => (
                  <button
                    key={color.name}
                    className={`${color.class} h-8 w-8 rounded-full border-2 border-transparent hover:border-foreground transition-colors`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Layout Settings</CardTitle>
            <CardDescription>
              Customize the layout and spacing of your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Sidebar Width</Label>
              <Slider
                value={sidebarWidth}
                onValueChange={setSidebarWidth}
                max={400}
                min={200}
                step={20}
                className="w-full"
              />
              <div className="text-sm text-muted-foreground">
                Current width: {sidebarWidth[0]}px
              </div>
            </div>

            <div className="space-y-2">
              <Label>Font Size</Label>
              <Slider
                value={fontSize}
                onValueChange={setFontSize}
                max={18}
                min={12}
                step={1}
                className="w-full"
              />
              <div className="text-sm text-muted-foreground">
                Current size: {fontSize[0]}px
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="compact-mode">Compact Mode</Label>
                <Switch id="compact-mode" />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="sidebar-collapsed">Sidebar Auto-collapse</Label>
                <Switch id="sidebar-collapsed" />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="animations">Enable Animations</Label>
                <Switch id="animations" defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dashboard Preferences</CardTitle>
            <CardDescription>
              Configure how your dashboard displays information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Default Dashboard View</Label>
              <Select defaultValue="overview">
                <SelectTrigger>
                  <SelectValue placeholder="Select default view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                  <SelectItem value="reports">Reports</SelectItem>
                  <SelectItem value="notifications">Notifications</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data Refresh Rate</Label>
              <Select defaultValue="30">
                <SelectTrigger>
                  <SelectValue placeholder="Select refresh rate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 seconds</SelectItem>
                  <SelectItem value="15">15 seconds</SelectItem>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="60">1 minute</SelectItem>
                  <SelectItem value="300">5 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="real-time-updates">Real-time Updates</Label>
                <Switch id="real-time-updates" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="sound-notifications">Sound Notifications</Label>
                <Switch id="sound-notifications" />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="show-tooltips">Show Tooltips</Label>
                <Switch id="show-tooltips" defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Widget Configuration</CardTitle>
            <CardDescription>
              Choose which widgets to display on your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              {[
                { name: "Revenue Chart", enabled: true },
                { name: "User Analytics", enabled: true },
                { name: "Recent Activity", enabled: true },
                { name: "System Status", enabled: false },
                { name: "Performance Metrics", enabled: true },
                { name: "API Usage", enabled: false },
              ].map((widget) => (
                <div key={widget.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Switch defaultChecked={widget.enabled} />
                    <Label>{widget.name}</Label>
                  </div>
                  <Badge variant={widget.enabled ? "default" : "secondary"}>
                    {widget.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button>Save Changes</Button>
          <Button variant="outline">Reset to Default</Button>
        </div>
      </div>
    </div>
  )
}
