import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  FileText,
  Plus,
  Calendar,
  Building2,
  Loader2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from "date-fns";
import { nl } from "date-fns/locale";

type ReportType = "weekly_department" | "weekly_mt" | "monthly_department" | "monthly_mt";

const reportTypeLabels: Record<ReportType, string> = {
  weekly_department: "Weekrapport Afdeling",
  weekly_mt: "Weekrapport MT",
  monthly_department: "Maandrapport Afdeling",
  monthly_mt: "Maandrapport MT",
};

export default function RapportagesPage() {
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedType, setSelectedType] = useState<ReportType>("weekly_department");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<"current" | "previous">("previous");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const reports = useQuery(api.reports.list, { limit: 20 });
  const departments = useQuery(api.departments.list, {});

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerateError(null);

    try {
      const isWeekly = selectedType.includes("weekly");
      const now = new Date();

      let dateRangeStart: number;
      let dateRangeEnd: number;

      if (isWeekly) {
        const targetDate = selectedPeriod === "current" ? now : subWeeks(now, 1);
        dateRangeStart = startOfWeek(targetDate, { weekStartsOn: 1 }).getTime();
        dateRangeEnd = endOfWeek(targetDate, { weekStartsOn: 1 }).getTime();
      } else {
        const targetDate = selectedPeriod === "current" ? now : subMonths(now, 1);
        dateRangeStart = startOfMonth(targetDate).getTime();
        dateRangeEnd = endOfMonth(targetDate).getTime();
      }

      const response = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedType,
          departmentId: selectedType.includes("department") ? selectedDepartmentId : undefined,
          dateRangeStart,
          dateRangeEnd,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Rapport genereren mislukt");
      }

      setShowNewDialog(false);
      setSelectedType("weekly_department");
      setSelectedDepartmentId("");
      setSelectedPeriod("previous");
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Onbekende fout");
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDateRange = (start: number, end: number) => {
    return `${format(new Date(start), "d MMM", { locale: nl })} - ${format(new Date(end), "d MMM yyyy", { locale: nl })}`;
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Rapportages</h1>
            <p className="text-muted-foreground">
              Gegenereerde week- en maandrapporten
            </p>
          </div>
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nieuw rapport
          </Button>
        </div>

        {/* Reports List */}
        {reports === undefined ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Geen rapporten</h3>
              <p className="text-muted-foreground text-center mb-4">
                Er zijn nog geen rapporten gegenereerd.
              </p>
              <Button onClick={() => setShowNewDialog(true)}>
                <Sparkles className="mr-2 h-4 w-4" />
                Genereer eerste rapport
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {reports.map((report) => (
              <Link key={report._id} href={`/rapportages/${report._id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <CardTitle className="text-lg">
                            {reportTypeLabels[report.type as ReportType]}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Calendar className="h-3 w-3" />
                            {formatDateRange(report.dateRangeStart, report.dateRangeEnd)}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {report.redFlags && report.redFlags.length > 0 && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {report.redFlags.length}
                          </Badge>
                        )}
                        {report.sentAt && (
                          <Badge variant="secondary">Verzonden</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {report.highlights && report.highlights.length > 0 && (
                        <span>{report.highlights.length} highlights</span>
                      )}
                      <span>
                        Gemaakt op {format(new Date(report.createdAt), "d MMM yyyy HH:mm", { locale: nl })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* New Report Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuw rapport genereren</DialogTitle>
            <DialogDescription>
              Selecteer het type rapport en de periode
            </DialogDescription>
          </DialogHeader>

          {generateError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {generateError}
            </div>
          )}

          <div className="space-y-4 py-4">
            {/* Report Type */}
            <div className="space-y-2">
              <Label>Rapport type</Label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(reportTypeLabels) as ReportType[]).map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={selectedType === type ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => setSelectedType(type)}
                  >
                    {reportTypeLabels[type]}
                  </Button>
                ))}
              </div>
            </div>

            {/* Department Selection (only for department reports) */}
            {selectedType.includes("department") && (
              <div className="space-y-2">
                <Label>Afdeling</Label>
                <div className="grid grid-cols-2 gap-2">
                  {departments?.map((dept) => (
                    <Button
                      key={dept._id}
                      type="button"
                      variant={selectedDepartmentId === dept._id ? "default" : "outline"}
                      className="justify-start"
                      onClick={() => setSelectedDepartmentId(dept._id)}
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      {dept.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Period Selection */}
            <div className="space-y-2">
              <Label>Periode</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={selectedPeriod === "previous" ? "default" : "outline"}
                  onClick={() => setSelectedPeriod("previous")}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Vorige {selectedType.includes("weekly") ? "week" : "maand"}
                </Button>
                <Button
                  type="button"
                  variant={selectedPeriod === "current" ? "default" : "outline"}
                  onClick={() => setSelectedPeriod("current")}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Huidige {selectedType.includes("weekly") ? "week" : "maand"}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Annuleren
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={
                isGenerating ||
                (selectedType.includes("department") && !selectedDepartmentId)
              }
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Genereren...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Genereer rapport
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
