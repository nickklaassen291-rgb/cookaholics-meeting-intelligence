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
              Welkom bij Cookaholics Meeting Intelligence
            </p>
          </div>
          <Button asChild>
            <Link href="/vergaderingen/nieuw">
              <Upload className="mr-2 h-4 w-4" />
              Vergadering uploaden
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Vergaderingen vandaag
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                2 afgerond, 1 gepland
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Open actiepunten
              </CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                3 deadline deze week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Transcripties in behandeling
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">
                Wordt verwerkt...
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Rode vlaggen
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">1</div>
              <p className="text-xs text-muted-foreground">
                Vereist aandacht
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upcoming Meetings */}
          <Card>
            <CardHeader>
              <CardTitle>Komende vergaderingen</CardTitle>
              <CardDescription>
                Geplande vergaderingen voor vandaag en morgen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <CalendarDays className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Marketing Wekelijks Overleg</p>
                    <p className="text-sm text-muted-foreground">
                      Vandaag om 14:00 - Marketing
                    </p>
                  </div>
                  <Badge>Wekelijks</Badge>
                </div>

                <div className="flex items-center gap-4 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <CalendarDays className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Sales Daily Standup</p>
                    <p className="text-sm text-muted-foreground">
                      Morgen om 09:00 - Sales
                    </p>
                  </div>
                  <Badge variant="secondary">Dagelijks</Badge>
                </div>

                <div className="flex items-center gap-4 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <CalendarDays className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Marketing-Sales Sync</p>
                    <p className="text-sm text-muted-foreground">
                      Morgen om 11:00 - Cross-afdeling
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
              <CardTitle>Mijn actiepunten</CardTitle>
              <CardDescription>
                Actiepunten aan jou toegewezen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4 rounded-lg border p-3">
                  <div className="flex h-5 w-5 items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-destructive" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Q4 budget voorstel beoordelen</p>
                    <p className="text-sm text-muted-foreground">
                      Uit: MT Maandelijks - Deadline: Vandaag
                    </p>
                  </div>
                  <Badge variant="destructive">Te laat</Badge>
                </div>

                <div className="flex items-start gap-4 rounded-lg border p-3">
                  <div className="flex h-5 w-5 items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Klant follow-up email versturen</p>
                    <p className="text-sm text-muted-foreground">
                      Uit: Sales Wekelijks - Deadline: Morgen
                    </p>
                  </div>
                  <Badge variant="secondary">Bijna</Badge>
                </div>

                <div className="flex items-start gap-4 rounded-lg border p-3">
                  <div className="flex h-5 w-5 items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Menu prijzen bijwerken</p>
                    <p className="text-sm text-muted-foreground">
                      Uit: Keuken Wekelijks - Deadline: Vrijdag
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
            <CardTitle>Recente activiteit</CardTitle>
            <CardDescription>
              Laatste updates van alle afdelingen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">Marketing Daily</span> transcriptie voltooid
                  </p>
                  <p className="text-xs text-muted-foreground">2 minuten geleden</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">Jan</span> heeft actiepunt afgerond: Social media kalender bijwerken
                  </p>
                  <p className="text-xs text-muted-foreground">15 minuten geleden</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">Sales Wekelijks</span> heeft een rode vlag: klantklacht genoemd
                  </p>
                  <p className="text-xs text-muted-foreground">1 uur geleden</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">Wekelijkse MT Digest</span> rapportage gegenereerd
                  </p>
                  <p className="text-xs text-muted-foreground">3 uur geleden</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
