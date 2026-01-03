import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, CheckSquare, Clock, Upload, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export default function DashboardPage() {
  const meetings = useQuery(api.meetings.list, { limit: 10 });
  const upcomingMeetings = useQuery(api.meetings.listUpcoming, { limit: 5 });
  const openActionItems = useQuery(api.actionItems.listOpen, { limit: 5 });
  const overdueItems = useQuery(api.actionItems.listOverdue, {});

  // Calculate stats
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todaysMeetings = meetings?.filter((m) => {
    const date = new Date(m.date);
    return date >= todayStart && date <= todayEnd;
  }) || [];

  const completedToday = todaysMeetings.filter((m) => m.status === "completed").length;
  const scheduledToday = todaysMeetings.filter((m) => m.status === "scheduled").length;

  const pendingTranscriptions = meetings?.filter(
    (m) => m.transcriptionStatus === "pending" || m.transcriptionStatus === "processing"
  ).length || 0;

  const redFlagCount = meetings?.filter((m) => m.redFlags && m.redFlags.length > 0).length || 0;

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
              <div className="text-2xl font-bold">{todaysMeetings.length}</div>
              <p className="text-xs text-muted-foreground">
                {completedToday} afgerond, {scheduledToday} gepland
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
              <div className="text-2xl font-bold">{openActionItems?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                {overdueItems?.length || 0} te laat
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
              <div className="text-2xl font-bold">{pendingTranscriptions}</div>
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
              <div className="text-2xl font-bold text-destructive">{redFlagCount}</div>
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
                Geplande vergaderingen voor de komende dagen
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!upcomingMeetings || upcomingMeetings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CalendarDays className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Geen komende vergaderingen</p>
                  <Button asChild variant="outline" className="mt-4">
                    <Link href="/vergaderingen/nieuw">Vergadering plannen</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingMeetings.map((meeting) => (
                    <Link key={meeting._id} href={`/vergaderingen/${meeting._id}`}>
                      <div className="flex items-center gap-4 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <CalendarDays className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{meeting.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(meeting.date), "EEEE d MMM 'om' HH:mm", { locale: nl })}
                          </p>
                        </div>
                        <Badge variant="outline">{meeting.duration} min</Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Action Items */}
          <Card>
            <CardHeader>
              <CardTitle>Open actiepunten</CardTitle>
              <CardDescription>
                Actiepunten die nog afgerond moeten worden
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!openActionItems || openActionItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckSquare className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Geen open actiepunten</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {openActionItems.map((item) => {
                    const now = todayStart.getTime();
                    const twoDaysFromNow = now + 2 * 24 * 60 * 60 * 1000;
                    const isOverdue = item.deadline && item.deadline < now;
                    const isDueSoon = item.deadline &&
                      item.deadline > now &&
                      item.deadline < twoDaysFromNow;

                    return (
                      <div key={item._id} className="flex items-start gap-4 rounded-lg border p-3">
                        <div className="flex h-5 w-5 items-center justify-center">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              isOverdue
                                ? "bg-destructive"
                                : isDueSoon
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.ownerName && `${item.ownerName} - `}
                            {item.deadline
                              ? `Deadline: ${format(new Date(item.deadline), "d MMM", { locale: nl })}`
                              : "Geen deadline"}
                          </p>
                        </div>
                        <Badge
                          variant={
                            isOverdue ? "destructive" : isDueSoon ? "secondary" : "outline"
                          }
                        >
                          {isOverdue ? "Te laat" : isDueSoon ? "Bijna" : "Open"}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recente vergaderingen</CardTitle>
            <CardDescription>
              Laatst aangemaakte of bijgewerkte vergaderingen
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!meetings || meetings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarDays className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nog geen vergaderingen</p>
                <Button asChild className="mt-4">
                  <Link href="/vergaderingen/nieuw">
                    <Upload className="mr-2 h-4 w-4" />
                    Eerste vergadering aanmaken
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {meetings.slice(0, 5).map((meeting) => (
                  <Link key={meeting._id} href={`/vergaderingen/${meeting._id}`}>
                    <div className="flex items-center gap-4 hover:bg-muted/50 rounded-lg p-2 transition-colors">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          meeting.status === "completed"
                            ? "bg-green-500"
                            : meeting.status === "scheduled"
                            ? "bg-blue-500"
                            : "bg-gray-500"
                        }`}
                      />
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{meeting.title}</span>
                          {" - "}
                          {meeting.status === "completed"
                            ? "afgerond"
                            : meeting.status === "scheduled"
                            ? "gepland"
                            : "geannuleerd"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(meeting.date), "d MMMM yyyy", { locale: nl })}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
