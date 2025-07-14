import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

export default async function ConfigurationPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuration</h1>
        <p className="text-muted-foreground">
          Manage your application settings and preferences
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure your application's basic settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="app-name">Application Name</Label>
                  <Input
                    id="app-name"
                    placeholder="Enter application name"
                    defaultValue="NeuronixS"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="app-url">Application URL</Label>
                  <Input
                    id="app-url"
                    placeholder="https://your-app.com"
                    defaultValue="https://neuronixs.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="app-description">Description</Label>
                <Textarea
                  id="app-description"
                  placeholder="Enter application description"
                  defaultValue="A modern dashboard application built with Next.js and Supabase"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select defaultValue="utc">
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utc">UTC</SelectItem>
                    <SelectItem value="est">Eastern Time</SelectItem>
                    <SelectItem value="pst">Pacific Time</SelectItem>
                    <SelectItem value="cet">Central European Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="maintenance-mode" />
                <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
              </div>

              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                Manage your API keys and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="••••••••••••••••"
                  defaultValue="sk-1234567890abcdef"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate-limit">Rate Limit (requests per minute)</Label>
                <Input
                  id="rate-limit"
                  type="number"
                  placeholder="1000"
                  defaultValue="1000"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="api-logging" defaultChecked />
                <Label htmlFor="api-logging">Enable API Logging</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="cors-enabled" defaultChecked />
                <Label htmlFor="cors-enabled">Enable CORS</Label>
              </div>

              <Button>Update API Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Configuration</CardTitle>
              <CardDescription>
                Configure your Supabase database settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="db-url">Database URL</Label>
                <Input
                  id="db-url"
                  placeholder="postgresql://..."
                  defaultValue="postgresql://postgres:***@db.supabase.co:5432/postgres"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="max-connections">Max Connections</Label>
                  <Input
                    id="max-connections"
                    type="number"
                    placeholder="100"
                    defaultValue="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="connection-timeout">Connection Timeout (ms)</Label>
                  <Input
                    id="connection-timeout"
                    type="number"
                    placeholder="30000"
                    defaultValue="30000"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="db-ssl" defaultChecked />
                <Label htmlFor="db-ssl">Enable SSL</Label>
              </div>

              <Button>Save Database Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>
                Configure your Resend email settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="resend-api-key">Resend API Key</Label>
                <Input
                  id="resend-api-key"
                  type="password"
                  placeholder="re_••••••••••••••••"
                  defaultValue="re_123456789abcdef"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="from-email">From Email</Label>
                  <Input
                    id="from-email"
                    type="email"
                    placeholder="noreply@neuronixs.com"
                    defaultValue="noreply@neuronixs.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from-name">From Name</Label>
                  <Input
                    id="from-name"
                    placeholder="NeuronixS"
                    defaultValue="NeuronixS"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reply-to">Reply To Email</Label>
                <Input
                  id="reply-to"
                  type="email"
                  placeholder="support@neuronixs.com"
                  defaultValue="support@neuronixs.com"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="email-notifications" defaultChecked />
                <Label htmlFor="email-notifications">Enable Email Notifications</Label>
              </div>

              <Button>Save Email Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="jwt-secret">JWT Secret</Label>
                <Input
                  id="jwt-secret"
                  type="password"
                  placeholder="••••••••••••••••"
                  defaultValue="your-jwt-secret-key"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (hours)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    placeholder="24"
                    defaultValue="24"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-strength">Password Strength</Label>
                  <Select defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue placeholder="Select strength" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch id="two-factor" />
                  <Label htmlFor="two-factor">Enable Two-Factor Authentication</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="login-attempts" defaultChecked />
                  <Label htmlFor="login-attempts">Limit Login Attempts</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="audit-logs" defaultChecked />
                  <Label htmlFor="audit-logs">Enable Audit Logs</Label>
                </div>
              </div>

              <Button>Update Security Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
