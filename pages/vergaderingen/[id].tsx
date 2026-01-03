import { useState } from "react";
import { useRouter } from "next/router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { AudioUploader, AudioPlayer, TranscriptionDisplay } from "@/components/audio";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  FileText,
  CheckSquare,
  AlertTriangle,
  Mic,
  Loader2,
} from "lucide-react";
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

export default function VergaderingDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const meeting = useQuery(
    api.meetings.getById,
    id ? { id: id as Id<"meetings"> } : "skip"
  );
  const departments = useQuery(api.departments.list, {});
  const meetingTypes = useQuery(api.meetingTypes.list, {});
  const users = useQuery(api.users.list, {});
  const actionItems = useQuery(
    api.actionItems.listByMeeting,
    meeting ? { meetingId: meeting._id } : "skip"
  );

  const updateStatus = useMutation(api.meetings.updateStatus);
  const deleteMeeting = useMutation(api.meetings.remove);

  if (!meeting) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  const meetingType = meetingTypes?.find((t) => t._id === meeting.meetingTypeId);
  const meetingDepartments = departments?.filter((d) =>
    meeting.departmentIds.includes(d._id)
  );
  const attendees = users?.filter((u) => meeting.attendeeIds.includes(u._id));
  const presentAttendees = meeting.presentAttendeeIds || [];

  const handleStatusChange = async (newStatus: "scheduled" | "completed" | "cancelled") => {
    try {
      await updateStatus({
        id: meeting._id,
        status: newStatus,
        presentAttendeeIds: newStatus === "completed" ? presentAttendees as Id<"users">[] : undefined,
      });
      toast({
        title: "Status bijgewerkt",
        description: `Vergadering is nu ${newStatus === "scheduled" ? "gepland" : newStatus === "completed" ? "afgerond" : "geannuleerd"}`,
      });
    } catch {
      toast({
        title: "Fout",
        description: "Kon status niet bijwerken",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteMeeting({ id: meeting._id });
      toast({
        title: "Vergadering verwijderd",
        description: "De vergadering is succesvol verwijderd",
      });
      router.push("/vergaderingen");
    } catch {
      toast({
        title: "Fout",
        description: "Kon vergadering niet verwijderen",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const toggleAttendeePresence = (userId: Id<"users">) => {
    // Toggle presence for the given user
    const isPresent = presentAttendees.includes(userId);
    const newPresent = isPresent
      ? presentAttendees.filter((id) => id !== userId)
      : [...presentAttendees, userId];

    // Update meeting with new present attendees
    updateStatus({
      id: meeting._id,
      status: meeting.status as "scheduled" | "completed" | "cancelled",
      presentAttendeeIds: newPresent,
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/vergaderingen">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{meeting.title}</h1>
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleStatusChange("scheduled")}>
                Markeer als gepland
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange("completed")}>
                Markeer als afgerond
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange("cancelled")}>
                Markeer als geannuleerd
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/vergaderingen/${meeting._id}/bewerken`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Bewerken
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Verwijderen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                    ? "Beluister de audio-opname van deze vergadering"
                    : "Upload de audio-opname van deze vergadering"}
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
                <CardDescription>
                  Automatisch gegenereerde transcriptie van de vergadering
                </CardDescription>
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
                  <FileText className="h-5 w-5" />
                  Samenvatting
                </CardTitle>
                <CardDescription>
                  AI-gegenereerde samenvatting van de vergadering
                </CardDescription>
              </CardHeader>
              <CardContent>
                {meeting.summary ? (
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{meeting.summary}</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-4 opacity-50" />
                    <p>Nog geen samenvatting beschikbaar</p>
                    <p className="text-sm">Wordt gegenereerd na transcriptie</p>
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
                  Actiepunten uit deze vergadering
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
                        <Checkbox checked={item.status === "done"} />
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
                            item.status === "done"
                              ? "secondary"
                              : item.status === "in_progress"
                              ? "default"
                              : "outline"
                          }
                        >
                          {item.status === "done"
                            ? "Afgerond"
                            : item.status === "in_progress"
                            ? "Bezig"
                            : "Open"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckSquare className="h-10 w-10 mx-auto mb-4 opacity-50" />
                    <p>Nog geen actiepunten</p>
                    <p className="text-sm">Worden geëxtraheerd na transcriptie</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Red Flags Section */}
            {meeting.redFlags && meeting.redFlags.length > 0 && (
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Rode vlaggen
                  </CardTitle>
                  <CardDescription>
                    Gedetecteerde escalaties en aandachtspunten
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
                        <div>
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
            {/* Meeting Info */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <p>{meetingType?.name || "Onbekend"}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Afdeling(en)</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {meetingDepartments?.map((dept) => (
                      <Badge key={dept._id} variant="secondary">
                        {dept.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Aangemaakt</p>
                  <p>{format(new Date(meeting.createdAt), "d MMMM yyyy", { locale: nl })}</p>
                </div>
              </CardContent>
            </Card>

            {/* Attendees */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Deelnemers
                </CardTitle>
                <CardDescription>
                  {attendees?.length || 0} uitgenodigd
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {attendees?.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted"
                    >
                      <Checkbox
                        checked={presentAttendees.includes(user._id)}
                        onCheckedChange={() => toggleAttendeePresence(user._id)}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  ))}
                  {(!attendees || attendees.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Geen deelnemers toegevoegd
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Delete Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Vergadering verwijderen?</DialogTitle>
              <DialogDescription>
                Weet je zeker dat je deze vergadering wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Annuleren
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verwijderen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
