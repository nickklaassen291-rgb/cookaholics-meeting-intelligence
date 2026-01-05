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
  FileText,
  Building2,
  TrendingUp,
  Flag,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export default function MTDashboardPage() {
  const departments = useQuery(api.departments.list, {});
  const redFlagMeetings = useQuery(api.meetings.listWithRedFlags, { limit: 10 });
  const recentReports = useQuery(api.reports.list, { limit: 5 });
  const openActionItems = useQuery(api.actionItems.listOpen, {});
  const overdueItems = useQuery(api.actionItems.listOverdue, {});
  const todaysMeetings = useQuery(api.meetings.listToday, {});
  const thisWeekMeetings = useQuery(api.meetings.listThisWeek, {});

  const totalOverdue = overdueItems?.length || 0;
  const totalOpen = openActionItems?.length || 0;
  const totalRedFlags = redFlagMeetings?.reduce(
    (acc, m) => acc + (m.redFlags?.length || 0),
    0
  ) || 0;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">MT Dashboard</h1>
            <p className="text-muted-foreground">
              Management overzicht van alle afdelingen
            </p>
          </div>
          <Button asChild>
            <Link href="/rapportages">
              <FileText className="mr-2 h-4 w-4" />
              Rapportages
            </Link>
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Afdelingen</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{departments?.length ?? "..."}</div>
            </CardContent>
          </Card>

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
              <CardTitle className="text-sm font-medium">Deze week</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{thisWeekMeetings?.length ?? "..."}</div>
              <p className="text-xs text-muted-foreground">vergaderingen</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Open actiepunten</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOpen}</div>
            </CardContent>
          </Card>

          <Card className={totalRedFlags > 0 ? "border-destructive" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Red Flags</CardTitle>
              <Flag className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{totalRedFlags}</div>
            </CardContent>
          </Card>
        </div>

        {/* All Departments Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Afdelingen overzicht
            </CardTitle>
            <CardDescription>Status per afdeling</CardDescription>
          </CardHeader>
          <CardContent>
            {departments === undefined ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {departments
                  .filter((d) => d.slug !== "mt")
                  .map((dept) => (
                    <DepartmentCard key={dept._id} departmentId={dept._id} department={dept} />
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Red Flags & Escalations */}
          <Card className={totalRedFlags > 0 ? "border-destructive/50" : ""}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Red Flags & Escalaties
                </CardTitle>
                <CardDescription>
                  Punten die aandacht nodig hebben
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {redFlagMeetings === undefined ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : redFlagMeetings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertTriangle className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Geen red flags gevonden</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Alles ziet er goed uit!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {redFlagMeetings.map((meeting) => (
                    <div
                      key={meeting._id}
                      className="p-4 rounded-lg border border-destructive/30 bg-destructive/5"
                    >
                      <Link
                        href={`/vergaderingen/${meeting._id}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {meeting.title}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(meeting.date), "d MMMM yyyy", { locale: nl })}
                      </p>
                      <div className="mt-3 space-y-2">
                        {meeting.redFlags?.map((flag, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 text-sm"
                          >
                            <Badge
                              variant={
                                flag.severity === "high"
                                  ? "destructive"
                                  : flag.severity === "medium"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs mt-0.5"
                            >
                              {flag.severity === "high"
                                ? "Hoog"
                                : flag.severity === "medium"
                                ? "Medium"
                                : "Laag"}
                            </Badge>
                            <div>
                              <p className="font-medium">{flag.type}</p>
                              <p className="text-muted-foreground">
                                {flag.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Reports */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recente rapportages
                </CardTitle>
                <CardDescription>Laatst gegenereerde rapporten</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/rapportages">
                  Alle <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentReports === undefined ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : recentReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Nog geen rapportages</p>
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <Link href="/rapportages">Genereer rapport</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentReports.map((report) => (
                    <Link
                      key={report._id}
                      href={`/rapportages/${report._id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">
                          {report.type === "weekly_department"
                            ? "Wekelijks afdelingsrapport"
                            : report.type === "weekly_mt"
                            ? "Wekelijks MT rapport"
                            : report.type === "monthly_department"
                            ? "Maandelijks afdelingsrapport"
                            : "Maandelijks MT rapport"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(report.dateRangeStart), "d MMM", {
                            locale: nl,
                          })}{" "}
                          -{" "}
                          {format(new Date(report.dateRangeEnd), "d MMM yyyy", {
                            locale: nl,
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {report.sentAt && (
                          <Badge variant="outline" className="text-xs">
                            Verzonden
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {format(new Date(report.createdAt), "d MMM", {
                            locale: nl,
                          })}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Overdue Action Items */}
        {totalOverdue > 0 && (
          <Card className="border-destructive/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Verlopen actiepunten ({totalOverdue})
                </CardTitle>
                <CardDescription>
                  Actiepunten waarvan de deadline is verstreken
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/actiepunten">
                  Alle actiepunten <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {overdueItems?.slice(0, 5).map((item) => (
                  <Link
                    key={item._id}
                    href={`/actiepunten/${item._id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{item.description}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        {item.ownerName && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {item.ownerName}
                          </span>
                        )}
                        {item.deadline && (
                          <span className="text-destructive">
                            Deadline:{" "}
                            {format(new Date(item.deadline), "d MMM", {
                              locale: nl,
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="destructive">Verlopen</Badge>
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

// Department Card Component with stats
function DepartmentCard({
  departmentId,
  department,
}: {
  departmentId: string;
  department: { _id: string; name: string; slug: string; description?: string };
}) {
  const stats = useQuery(api.meetings.getDepartmentStats, {
    departmentId: departmentId as any,
  });

  return (
    <Link
      href={`/afdelingen/${department.slug}`}
      className="block p-4 rounded-lg border hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{department.name}</h3>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
      {stats === undefined ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-bold">{stats.thisWeekMeetings}</p>
            <p className="text-xs text-muted-foreground">Deze week</p>
          </div>
          <div>
            <p className="text-lg font-bold">{stats.openActionItems}</p>
            <p className="text-xs text-muted-foreground">Open</p>
          </div>
          <div>
            <p
              className={`text-lg font-bold ${
                stats.overdueActionItems > 0 ? "text-destructive" : ""
              }`}
            >
              {stats.overdueActionItems}
            </p>
            <p className="text-xs text-muted-foreground">Te laat</p>
          </div>
        </div>
      )}
    </Link>
  );
}
