import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  CheckSquare,
  Clock,
  AlertTriangle,
  Upload,
  FileText,
  ArrowRight,
  PlayCircle,
  CheckCircle2,
  Circle,
  Calendar,
  User,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

type Status = "open" | "in_progress" | "done";
type Priority = "high" | "medium" | "low";

const statusIcons: Record<Status, React.ReactNode> = {
  open: <Circle className="h-4 w-4 text-blue-500" />,
  in_progress: <PlayCircle className="h-4 w-4 text-yellow-500" />,
  done: <CheckCircle2 className="h-4 w-4 text-green-500" />,
};

const priorityLabels: Record<Priority, string> = {
  high: "Hoog",
  medium: "Medium",
  low: "Laag",
};

export default function DashboardPage() {
  const meetings = useQuery(api.meetings.list, { limit: 10 });
  const todaysMeetings = useQuery(api.meetings.listToday, {});
  const upcomingMeetings = useQuery(api.meetings.listUpcoming, { limit: 5 });
  const openActionItems = useQuery(api.actionItems.listOpen, { limit: 5 });
  const overdueItems = useQuery(api.actionItems.listOverdue, {});
  const recentActivity = useQuery(api.meetings.listRecentActivity, { limit: 5 });

  const now = Date.now();

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header with Quick Upload */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welkom terug! Hier is een overzicht van je vergaderingen en actiepunten.
            </p>
          </div>
          <Button asChild>
            <Link href="/vergaderingen/nieuw">
              <Upload className="mr-2 h-4 w-4" />
              Nieuwe vergadering
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Vandaag</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todaysMeetings?.length ?? "..."}</div>
              <p className="text-xs text-muted-foreground">vergaderingen</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Komende</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingMeetings?.length ?? "..."}</div>
              <p className="text-xs text-muted-foreground">gepland</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Open actiepunten</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openActionItems?.length ?? "..."}</div>
              <p className="text-xs text-muted-foreground">te doen</p>
            </CardContent>
          </Card>

          <Card className={overdueItems && overdueItems.length > 0 ? "border-destructive" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Te laat</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{overdueItems?.length ?? "..."}</div>
              <p className="text-xs text-muted-foreground">verlopen deadlines</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Today's Meetings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Vergaderingen vandaag
                </CardTitle>
                <CardDescription>
                  {todaysMeetings?.length === 0
                    ? "Geen vergaderingen vandaag"
                    : `${todaysMeetings?.length} vergadering${todaysMeetings?.length === 1 ? "" : "en"}`}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/vergaderingen">
                  Alles <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {todaysMeetings === undefined ? (
                <p className="text-muted-foreground text-sm">Laden...</p>
              ) : todaysMeetings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CalendarDays className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Geen vergaderingen vandaag</p>
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <Link href="/vergaderingen/nieuw">Nieuwe plannen</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {todaysMeetings.map((meeting) => (
                    <Link
                      key={meeting._id}
                      href={`/vergaderingen/${meeting._id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate">{meeting.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(meeting.date), "HH:mm", { locale: nl })} -{" "}
                          {meeting.duration} min
                        </p>
                      </div>
                      <Badge
                        variant={
                          meeting.status === "completed"
                            ? "default"
                            : meeting.status === "scheduled"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {meeting.status === "completed"
                          ? "Afgerond"
                          : meeting.status === "scheduled"
                          ? "Gepland"
                          : "Geannuleerd"}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Action Items (Due Soon) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  Mijn actiepunten
                </CardTitle>
                <CardDescription>Binnenkort verlopen</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/actiepunten/mijn">
                  Alles <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {openActionItems === undefined ? (
                <p className="text-muted-foreground text-sm">Laden...</p>
              ) : openActionItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="h-10 w-10 text-green-500 mb-3" />
                  <p className="text-muted-foreground">Geen openstaande actiepunten</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {openActionItems.map((item) => {
                    const isOverdue = item.deadline && item.deadline < now;
                    return (
                      <Link
                        key={item._id}
                        href={`/actiepunten/${item._id}`}
                        className={`flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors ${
                          isOverdue ? "border-destructive/50 bg-destructive/5" : ""
                        }`}
                      >
                        <div className="mt-0.5">{statusIcons[item.status]}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.description}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            {item.deadline && (
                              <span
                                className={`flex items-center gap-1 ${
                                  isOverdue ? "text-destructive font-medium" : ""
                                }`}
                              >
                                {isOverdue ? (
                                  <AlertTriangle className="h-3 w-3" />
                                ) : (
                                  <Calendar className="h-3 w-3" />
                                )}
                                {format(new Date(item.deadline), "d MMM", { locale: nl })}
                              </span>
                            )}
                            {item.ownerName && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {item.ownerName}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant={
                            item.priority === "high"
                              ? "destructive"
                              : item.priority === "medium"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {priorityLabels[item.priority || "medium"]}
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Feed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recente activiteit
              </CardTitle>
              <CardDescription>Recent verwerkte vergaderingen</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/vergaderingen">
                Alle vergaderingen <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentActivity === undefined ? (
              <p className="text-muted-foreground text-sm">Laden...</p>
            ) : recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Nog geen verwerkte vergaderingen</p>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link href="/vergaderingen/nieuw">Upload je eerste vergadering</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((meeting) => (
                  <Link
                    key={meeting._id}
                    href={`/vergaderingen/${meeting._id}`}
                    className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium truncate">{meeting.title}</p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(meeting.updatedAt), "d MMM HH:mm", { locale: nl })}
                        </span>
                      </div>
                      {meeting.summary && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {meeting.summary.substring(0, 150)}...
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {meeting.transcription && (
                          <Badge variant="outline" className="text-xs">
                            Transcriptie
                          </Badge>
                        )}
                        {meeting.summary && (
                          <Badge variant="outline" className="text-xs">
                            Samenvatting
                          </Badge>
                        )}
                        {meeting.redFlags && meeting.redFlags.length > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {meeting.redFlags.length} red flag
                            {meeting.redFlags.length > 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Meetings */}
        {upcomingMeetings && upcomingMeetings.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Komende vergaderingen
                </CardTitle>
                <CardDescription>De volgende geplande vergaderingen</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/vergaderingen">
                  Agenda <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {upcomingMeetings.map((meeting) => (
                  <Link
                    key={meeting._id}
                    href={`/vergaderingen/${meeting._id}`}
                    className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <p className="font-medium truncate">{meeting.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(new Date(meeting.date), "EEEE d MMMM", { locale: nl })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(meeting.date), "HH:mm", { locale: nl })} -{" "}
                      {meeting.duration} min
                    </p>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
