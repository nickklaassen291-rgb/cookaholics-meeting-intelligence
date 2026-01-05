import { useRouter } from "next/router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  CheckSquare,
  AlertTriangle,
  Users,
  ArrowRight,
  Loader2,
  Calendar,
  User,
  Circle,
  PlayCircle,
  CheckCircle2,
  Upload,
  FileText,
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

export default function DepartmentDashboardPage() {
  const router = useRouter();
  const { slug } = router.query;

  const department = useQuery(
    api.departments.getBySlug,
    slug ? { slug: slug as string } : "skip"
  );

  const thisWeekMeetings = useQuery(
    api.meetings.listThisWeek,
    department?._id ? { departmentId: department._id } : "skip"
  );

  const todaysMeetings = useQuery(
    api.meetings.listToday,
    department?._id ? { departmentId: department._id } : "skip"
  );

  const stats = useQuery(
    api.meetings.getDepartmentStats,
    department?._id ? { departmentId: department._id } : "skip"
  );

  const actionItems = useQuery(
    api.actionItems.list,
    department?._id ? {} : "skip"
  );

  // Filter action items for this department's meetings
  const meetingIds = new Set(thisWeekMeetings?.map((m) => m._id) || []);
  const deptActionItems = actionItems?.filter(
    (ai) => ai.status !== "done"
  ).slice(0, 10);

  const now = Date.now();

  if (!department) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{department.name}</h1>
            <p className="text-muted-foreground">
              {department.description || `Overzicht van de afdeling ${department.name}`}
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Totaal vergaderingen</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalMeetings ?? "..."}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Deze week</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.thisWeekMeetings ?? "..."}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Afgerond</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.completedMeetings ?? "..."}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Open actiepunten</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.openActionItems ?? "..."}</div>
            </CardContent>
          </Card>

          <Card className={stats?.overdueActionItems && stats.overdueActionItems > 0 ? "border-destructive" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Te laat</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats?.overdueActionItems ?? "..."}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* This Week's Meetings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Vergaderingen deze week
                </CardTitle>
                <CardDescription>
                  {thisWeekMeetings?.length === 0
                    ? "Geen vergaderingen deze week"
                    : `${thisWeekMeetings?.length} vergadering${thisWeekMeetings?.length === 1 ? "" : "en"}`}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/vergaderingen">
                  Alle <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {thisWeekMeetings === undefined ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : thisWeekMeetings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CalendarDays className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Geen vergaderingen deze week</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {thisWeekMeetings.map((meeting) => {
                    const isToday = todaysMeetings?.some((m) => m._id === meeting._id);
                    return (
                      <Link
                        key={meeting._id}
                        href={`/vergaderingen/${meeting._id}`}
                        className={`flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors ${
                          isToday ? "border-primary/50 bg-primary/5" : ""
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{meeting.title}</p>
                            {isToday && (
                              <Badge variant="default" className="text-xs">
                                Vandaag
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(meeting.date), "EEEE d MMMM", { locale: nl })} om{" "}
                            {format(new Date(meeting.date), "HH:mm", { locale: nl })}
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
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Open Action Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  Open actiepunten
                </CardTitle>
                <CardDescription>Acties die nog afgerond moeten worden</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/actiepunten">
                  Alle <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {deptActionItems === undefined ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : deptActionItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="h-10 w-10 text-green-500 mb-3" />
                  <p className="text-muted-foreground">Geen openstaande actiepunten</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deptActionItems.map((item) => {
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

        {/* Recent Completed Meetings with Summaries */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent verwerkte vergaderingen
              </CardTitle>
              <CardDescription>Vergaderingen met samenvattingen</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {thisWeekMeetings === undefined ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                {thisWeekMeetings
                  .filter((m) => m.summary)
                  .slice(0, 5)
                  .map((meeting) => (
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
                            {format(new Date(meeting.date), "d MMM", { locale: nl })}
                          </span>
                        </div>
                        {meeting.summary && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {meeting.summary.substring(0, 150)}...
                          </p>
                        )}
                        {meeting.redFlags && meeting.redFlags.length > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="destructive" className="text-xs">
                              {meeting.redFlags.length} red flag
                              {meeting.redFlags.length > 1 ? "s" : ""}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                {thisWeekMeetings.filter((m) => m.summary).length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FileText className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">Nog geen verwerkte vergaderingen</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
