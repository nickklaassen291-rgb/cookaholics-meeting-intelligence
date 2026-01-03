import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, CheckSquare, Clock, Upload, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome to Cookaholics Meeting Intelligence
            </p>
          </div>
          <Button asChild>
            <Link href="/meetings/new">
              <Upload className="mr-2 h-4 w-4" />
              Upload Meeting
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Today&apos;s Meetings
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                2 completed, 1 upcoming
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Open Action Items
              </CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                3 due this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Transcriptions
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">
                Processing...
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Red Flags
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">1</div>
              <p className="text-xs text-muted-foreground">
                Needs attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upcoming Meetings */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Meetings</CardTitle>
              <CardDescription>
                Your scheduled meetings for today and tomorrow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <CalendarDays className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Marketing Weekly Sync</p>
                    <p className="text-sm text-muted-foreground">
                      Today at 14:00 - Marketing
                    </p>
                  </div>
                  <Badge>Weekly</Badge>
                </div>

                <div className="flex items-center gap-4 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <CalendarDays className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Sales Daily Standup</p>
                    <p className="text-sm text-muted-foreground">
                      Tomorrow at 09:00 - Sales
                    </p>
                  </div>
                  <Badge variant="secondary">Daily</Badge>
                </div>

                <div className="flex items-center gap-4 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <CalendarDays className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Marketing-Sales Sync</p>
                    <p className="text-sm text-muted-foreground">
                      Tomorrow at 11:00 - Cross-department
                    </p>
                  </div>
                  <Badge variant="outline">Cross</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* My Action Items */}
          <Card>
            <CardHeader>
              <CardTitle>My Action Items</CardTitle>
              <CardDescription>
                Action items assigned to you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4 rounded-lg border p-3">
                  <div className="flex h-5 w-5 items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-destructive" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Review Q4 budget proposal</p>
                    <p className="text-sm text-muted-foreground">
                      From: MT Monthly - Due: Today
                    </p>
                  </div>
                  <Badge variant="destructive">Overdue</Badge>
                </div>

                <div className="flex items-start gap-4 rounded-lg border p-3">
                  <div className="flex h-5 w-5 items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Send client follow-up email</p>
                    <p className="text-sm text-muted-foreground">
                      From: Sales Weekly - Due: Tomorrow
                    </p>
                  </div>
                  <Badge variant="secondary">Due Soon</Badge>
                </div>

                <div className="flex items-start gap-4 rounded-lg border p-3">
                  <div className="flex h-5 w-5 items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Update menu pricing</p>
                    <p className="text-sm text-muted-foreground">
                      From: Keuken Weekly - Due: Friday
                    </p>
                  </div>
                  <Badge variant="outline">Open</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates from across departments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">Marketing Daily</span> transcription completed
                  </p>
                  <p className="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">Jan</span> completed action item: Update social media calendar
                  </p>
                  <p className="text-xs text-muted-foreground">15 minutes ago</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">Sales Weekly</span> has a red flag: client complaint mentioned
                  </p>
                  <p className="text-xs text-muted-foreground">1 hour ago</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">Weekly MT Digest</span> report generated
                  </p>
                  <p className="text-xs text-muted-foreground">3 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
