import { useState } from "react";
import { useRouter } from "next/router";
import { useQuery } from "convex/react";
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
  CalendarDays,
  Clock,
  Users,
  Mic,
  FileText,
  Loader2,
  Sparkles,
  CheckSquare,
  AlertTriangle,
  Mail,
  Send,
  ScrollText,
  Printer,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { AudioUploader, AudioPlayer, TranscriptionDisplay } from "@/components/audio";

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

export default function VergaderingDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summarizeError, setSummarizeError] = useState<string | null>(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showScriptDialog, setShowScriptDialog] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);

  const meeting = useQuery(
    api.meetings.getById,
    id ? { id: id as Id<"meetings"> } : "skip"
  );

  const actionItems = useQuery(
    api.actionItems.listByMeeting,
    meeting ? { meetingId: meeting._id } : "skip"
  );

  const meetingScript = useQuery(
    api.meetingScripts.getDefaultByMeetingType,
    meeting?.meetingTypeId ? { meetingTypeId: meeting.meetingTypeId } : "skip"
  );

  const handlePrintScript = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow && meetingScript) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Vergaderscript - ${meeting?.title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { border-bottom: 2px solid #333; padding-bottom: 10px; }
            .section { margin: 24px 0; page-break-inside: avoid; }
            .section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
            .section-number { background: #333; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; }
            .section-title { font-weight: bold; font-size: 18px; }
            .section-description { color: #666; margin-bottom: 12px; }
            .phrases { border-left: 3px solid #ddd; padding-left: 16px; }
            .phrase { font-style: italic; color: #444; margin: 8px 0; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <h1>${meetingScript.name}</h1>
          <p style="color: #666;">Vergadering: ${meeting?.title}</p>
          ${meetingScript.sections.map(section => `
            <div class="section">
              <div class="section-header">
                <div class="section-number">${section.order}</div>
                <div class="section-title">${section.title}</div>
              </div>
              <div class="section-description">${section.description}</div>
              ${section.samplePhrases && section.samplePhrases.length > 0 ? `
                <div class="phrases">
                  ${section.samplePhrases.map(phrase => `<div class="phrase">"${phrase}"</div>`).join("")}
                </div>
              ` : ""}
            </div>
          `).join("")}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleSendEmail = async () => {
    if (!meeting || !emailAddress) return;

    setIsSendingEmail(true);
    setEmailError(null);

    try {
      const response = await fetch("/api/send-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId: meeting._id,
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

  const handleSummarize = async () => {
    if (!meeting) return;

    setIsSummarizing(true);
    setSummarizeError(null);

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId: meeting._id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Samenvatting maken mislukt");
      }
    } catch (err) {
      setSummarizeError(err instanceof Error ? err.message : "Onbekende fout");
    } finally {
      setIsSummarizing(false);
    }
  };

  if (!meeting) {
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
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/vergaderingen">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{meeting.title}</h1>
              <StatusBadge status={meeting.status} />
            </div>
            <div className="flex items-center gap-4 mt-2 text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                {format(new Date(meeting.date), "EEEE d MMMM yyyy", { locale: nl })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {format(new Date(meeting.date), "HH:mm", { locale: nl })} - {meeting.duration} min
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Audio Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  Audio opname
                </CardTitle>
                <CardDescription>
                  {meeting.audioFileId
                    ? "Beluister de audio-opname"
                    : "Upload de audio-opname"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {meeting.audioFileId ? (
                  <AudioPlayer
                    storageId={meeting.audioFileId}
                    fileName={meeting.audioFileName}
                  />
                ) : (
                  <AudioUploader meetingId={meeting._id} />
                )}
              </CardContent>
            </Card>

            {/* Transcription Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Transcriptie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TranscriptionDisplay
                  meetingId={meeting._id}
                  transcription={meeting.transcription}
                  status={meeting.transcriptionStatus}
                  hasAudio={!!meeting.audioFileId}
                />
              </CardContent>
            </Card>

            {/* Summary Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI Samenvatting
                </CardTitle>
                <CardDescription>
                  Automatisch gegenereerde samenvatting door Claude AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                {summarizeError && (
                  <div className="p-3 mb-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {summarizeError}
                  </div>
                )}

                {meeting.summary ? (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowEmailDialog(true)}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Verstuur per email
                      </Button>
                    </div>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <p className="whitespace-pre-wrap">{meeting.summary}</p>
                    </div>
                  </div>
                ) : meeting.transcription ? (
                  <div className="text-center py-6">
                    <Sparkles className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">
                      Genereer een AI samenvatting van de transcriptie
                    </p>
                    <Button onClick={handleSummarize} disabled={isSummarizing}>
                      {isSummarizing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Bezig met analyseren...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Genereer samenvatting
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-4 opacity-50" />
                    <p>Upload eerst audio en wacht op transcriptie</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Items Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  Actiepunten
                </CardTitle>
                <CardDescription>
                  Geëxtraheerde actiepunten uit de vergadering
                </CardDescription>
              </CardHeader>
              <CardContent>
                {actionItems && actionItems.length > 0 ? (
                  <div className="space-y-3">
                    {actionItems.map((item) => (
                      <div
                        key={item._id}
                        className="flex items-start gap-3 p-3 rounded-lg border"
                      >
                        <input
                          type="checkbox"
                          checked={item.status === "done"}
                          readOnly
                          className="mt-1 h-4 w-4"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{item.description}</p>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            {item.ownerName && <span>{item.ownerName}</span>}
                            {item.deadline && (
                              <span>
                                Deadline: {format(new Date(item.deadline), "d MMM", { locale: nl })}
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
                        >
                          {item.priority === "high" ? "Hoog" : item.priority === "medium" ? "Medium" : "Laag"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <CheckSquare className="h-10 w-10 mx-auto mb-4 opacity-50" />
                    <p>Nog geen actiepunten</p>
                    <p className="text-sm">Worden geëxtraheerd bij het genereren van de samenvatting</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Red Flags Section */}
            {meeting.redFlags && meeting.redFlags.length > 0 && (
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Rode vlaggen
                  </CardTitle>
                  <CardDescription>
                    Gedetecteerde aandachtspunten en escalaties
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {meeting.redFlags.map((flag, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10"
                      >
                        <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium">{flag.type}</p>
                          <p className="text-sm text-muted-foreground">{flag.description}</p>
                        </div>
                        <Badge variant="destructive">{flag.severity}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Meeting Script Card */}
            {meetingScript && (
              <Card className="border-primary/50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <ScrollText className="h-5 w-5 text-primary" />
                    Vergaderscript
                  </CardTitle>
                  <CardDescription>
                    Checklist voor de voorzitter
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {meetingScript.sections.slice(0, 3).map((section, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {section.order}
                        </div>
                        <span>{section.title}</span>
                      </div>
                    ))}
                    {meetingScript.sections.length > 3 && (
                      <p className="text-xs text-muted-foreground pl-7">
                        +{meetingScript.sections.length - 3} meer...
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setShowScriptDialog(true)}
                    >
                      Bekijken
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrintScript}
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Participants Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Deelnemers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {meeting.attendeeIds.length} deelnemer(s)
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Samenvatting versturen</DialogTitle>
            <DialogDescription>
              Verstuur de samenvatting en actiepunten per email
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
                <Button
                  variant="outline"
                  onClick={() => setShowEmailDialog(false)}
                >
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

      {/* Script Dialog */}
      <Dialog open={showScriptDialog} onOpenChange={setShowScriptDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5" />
              Vergaderscript
            </DialogTitle>
            <DialogDescription>
              Checklist voor de voorzitter - {meeting?.title}
            </DialogDescription>
          </DialogHeader>

          {meetingScript && (
            <div className="space-y-6 py-4">
              {meetingScript.sections.map((section, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                      {section.order}
                    </div>
                    <div>
                      <h3 className="font-semibold">{section.title}</h3>
                      <p className="text-sm text-muted-foreground">{section.description}</p>
                    </div>
                  </div>
                  {section.samplePhrases && section.samplePhrases.length > 0 && (
                    <div className="pl-11 space-y-1">
                      {section.samplePhrases.map((phrase, i) => (
                        <p key={i} className="text-sm italic text-muted-foreground border-l-2 border-primary/20 pl-3 py-1">
                          &ldquo;{phrase}&rdquo;
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScriptDialog(false)}>
              Sluiten
            </Button>
            <Button onClick={handlePrintScript}>
              <Printer className="mr-2 h-4 w-4" />
              Afdrukken
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
