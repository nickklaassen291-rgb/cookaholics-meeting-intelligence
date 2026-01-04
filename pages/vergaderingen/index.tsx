import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Plus, Clock, Users } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

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
  const meetings = useQuery(api.meetings.list, {});

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Vergaderingen</h1>
            <p className="text-muted-foreground">Beheer en bekijk alle vergaderingen</p>
          </div>
          <Button asChild>
            <Link href="/vergaderingen/nieuw">
              <Plus className="mr-2 h-4 w-4" />
              Nieuwe vergadering
            </Link>
          </Button>
        </div>

        <div className="space-y-4">
          {!meetings ? (
            <p>Laden...</p>
          ) : meetings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Geen vergaderingen gevonden</h3>
                <p className="text-muted-foreground">Maak een nieuwe vergadering aan.</p>
              </CardContent>
            </Card>
          ) : (
            meetings.map((meeting) => (
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
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
