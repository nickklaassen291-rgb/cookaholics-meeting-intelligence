import { useState } from "react";
import { useRouter } from "next/router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Calendar,
  Loader2,
  AlertTriangle,
  Sparkles,
  Mail,
  Send,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import ReactMarkdown from "react-markdown";

type ReportType = "weekly_department" | "weekly_mt" | "monthly_department" | "monthly_mt";

const reportTypeLabels: Record<ReportType, string> = {
  weekly_department: "Weekrapport Afdeling",
  weekly_mt: "Weekrapport MT",
  monthly_department: "Maandrapport Afdeling",
  monthly_mt: "Maandrapport MT",
};

export default function ReportDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const report = useQuery(
    api.reports.getById,
    id ? { id: id as Id<"reports"> } : "skip"
  );

  const department = useQuery(
    api.departments.getById,
    report?.departmentId ? { id: report.departmentId } : "skip"
  );

  const removeReport = useMutation(api.reports.remove);

  const handleSendEmail = async () => {
    if (!report || !emailAddress) return;

    setIsSendingEmail(true);
    setEmailError(null);

    try {
      const response = await fetch("/api/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: report._id,
          recipientEmail: emailAddress,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Email verzenden mislukt");
      }

      setEmailSuccess(true);
      setTimeout(() => {
        setShowEmailDialog(false);
        setEmailSuccess(false);
        setEmailAddress("");
      }, 2000);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Onbekende fout");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleDelete = async () => {
    if (!report) return;

    setIsDeleting(true);
    try {
      await removeReport({ id: report._id });
      router.push("/rapportages");
    } catch (err) {
      console.error("Delete error:", err);
      setIsDeleting(false);
    }
  };

  if (!report) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  const formatDateRange = (start: number, end: number) => {
    return `${format(new Date(start), "d MMMM", { locale: nl })} - ${format(new Date(end), "d MMMM yyyy", { locale: nl })}`;
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/rapportages">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">
                {reportTypeLabels[report.type as ReportType]}
              </h1>
              {report.sentAt && (
                <Badge variant="secondary">Verzonden</Badge>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDateRange(report.dateRangeStart, report.dateRangeEnd)}
              </span>
              {department && (
                <span>Afdeling: {department.name}</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowEmailDialog(true)}>
              <Mail className="mr-2 h-4 w-4" />
              Verstuur
            </Button>
            <Button variant="destructive" size="icon" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Report Content */}
            <Card>
              <CardContent className="pt-6">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{report.content}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Highlights */}
            {report.highlights && report.highlights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    Highlights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {report.highlights.map((highlight, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm"
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Red Flags */}
            {report.redFlags && report.redFlags.length > 0 && (
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Aandachtspunten
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {report.redFlags.map((flag, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm"
                      >
                        <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Meta Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informatie</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Aangemaakt</span>
                  <span>{format(new Date(report.createdAt), "d MMM yyyy HH:mm", { locale: nl })}</span>
                </div>
                {report.sentAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Verzonden</span>
                    <span>{format(new Date(report.sentAt), "d MMM yyyy HH:mm", { locale: nl })}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rapport versturen</DialogTitle>
            <DialogDescription>
              Verstuur dit rapport per email
            </DialogDescription>
          </DialogHeader>

          {emailSuccess ? (
            <div className="py-8 text-center">
              <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <Send className="h-6 w-6 text-green-600" />
              </div>
              <p className="font-medium text-green-600">Email verzonden!</p>
            </div>
          ) : (
            <>
              {emailError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {emailError}
                </div>
              )}

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email adres</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="naam@voorbeeld.nl"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
                  Annuleren
                </Button>
                <Button
                  onClick={handleSendEmail}
                  disabled={!emailAddress || isSendingEmail}
                >
                  {isSendingEmail ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verzenden...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Verzenden
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rapport verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je dit rapport wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verwijderen...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Verwijderen
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
