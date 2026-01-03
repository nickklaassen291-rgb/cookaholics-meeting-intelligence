import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays, List, Plus, Clock, Users } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

// Status badge styling
function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    scheduled: "outline",
    completed: "secondary",
    cancelled: "destructive",
  };
  const labels: Record<string, string> = {
    scheduled: "Gepland",
    completed: "Afgerond",
    cancelled: "Geannuleerd",
  };
  return <Badge variant={variants[status] || "outline"}>{labels[status] || status}</Badge>;
}

export default function VergaderingenPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const meetings = useQuery(api.meetings.list, {});
  const departments = useQuery(api.departments.list, {});

  // Filter meetings
  const filteredMeetings = meetings?.filter((meeting) => {
    if (statusFilter !== "all" && meeting.status !== statusFilter) return false;
    // Department filter would need to check departmentIds array
    return true;
  }) || [];

  // Get meetings for selected date in calendar
  const meetingsOnDate = selectedDate
    ? filteredMeetings.filter((m) => {
        const meetingDate = new Date(m.date);
        return (
          meetingDate.getDate() === selectedDate.getDate() &&
          meetingDate.getMonth() === selectedDate.getMonth() &&
          meetingDate.getFullYear() === selectedDate.getFullYear()
        );
      })
    : [];

  // Get dates that have meetings (for calendar highlighting)
  const datesWithMeetings = new Set(
    filteredMeetings.map((m) => format(new Date(m.date), "yyyy-MM-dd"))
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vergaderingen</h1>
            <p className="text-muted-foreground">
              Beheer en bekijk alle vergaderingen
            </p>
          </div>
          <Button asChild>
            <Link href="/vergaderingen/nieuw">
              <Plus className="mr-2 h-4 w-4" />
              Nieuwe vergadering
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Afdeling" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle afdelingen</SelectItem>
              {departments?.map((dept) => (
                <SelectItem key={dept._id} value={dept._id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle statussen</SelectItem>
              <SelectItem value="scheduled">Gepland</SelectItem>
              <SelectItem value="completed">Afgerond</SelectItem>
              <SelectItem value="cancelled">Geannuleerd</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs for List/Calendar view */}
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list" className="gap-2">
              <List className="h-4 w-4" />
              Lijst
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Kalender
            </TabsTrigger>
          </TabsList>

          {/* List View */}
          <TabsContent value="list" className="space-y-4">
            {filteredMeetings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Geen vergaderingen gevonden</h3>
                  <p className="text-muted-foreground text-center mt-1">
                    Er zijn nog geen vergaderingen gepland. Maak een nieuwe vergadering aan.
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/vergaderingen/nieuw">
                      <Plus className="mr-2 h-4 w-4" />
                      Nieuwe vergadering
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredMeetings.map((meeting) => (
                  <Link key={meeting._id} href={`/vergaderingen/${meeting._id}`}>
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                          <CalendarDays className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium truncate">{meeting.title}</h3>
                            <StatusBadge status={meeting.status} />
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(meeting.date), "d MMMM yyyy 'om' HH:mm", { locale: nl })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {meeting.attendeeIds.length} deelnemers
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {meeting.duration && (
                            <Badge variant="outline">{meeting.duration} min</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Calendar View */}
          <TabsContent value="calendar">
            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
              {/* Calendar */}
              <Card>
                <CardContent className="p-4">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    locale={nl}
                    modifiers={{
                      hasMeeting: (date) =>
                        datesWithMeetings.has(format(date, "yyyy-MM-dd")),
                    }}
                    modifiersStyles={{
                      hasMeeting: {
                        fontWeight: "bold",
                        backgroundColor: "hsl(var(--primary) / 0.1)",
                        color: "hsl(var(--primary))",
                      },
                    }}
                    className="rounded-md"
                  />
                </CardContent>
              </Card>

              {/* Meetings on selected date */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedDate
                      ? format(selectedDate, "EEEE d MMMM yyyy", { locale: nl })
                      : "Selecteer een datum"}
                  </CardTitle>
                  <CardDescription>
                    {meetingsOnDate.length} vergadering{meetingsOnDate.length !== 1 ? "en" : ""} gepland
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {meetingsOnDate.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <CalendarDays className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        Geen vergaderingen op deze dag
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {meetingsOnDate.map((meeting) => (
                        <Link key={meeting._id} href={`/vergaderingen/${meeting._id}`}>
                          <div className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                              <Clock className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{meeting.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(meeting.date), "HH:mm", { locale: nl })} - {meeting.duration} min
                              </p>
                            </div>
                            <StatusBadge status={meeting.status} />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
