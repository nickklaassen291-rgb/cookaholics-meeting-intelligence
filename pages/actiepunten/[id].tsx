import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Loader2,
  Save,
  Trash2,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle2,
  Circle,
  PlayCircle,
  FileText,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

type Status = "open" | "in_progress" | "done";
type Priority = "high" | "medium" | "low";

const statusLabels: Record<Status, string> = {
  open: "Open",
  in_progress: "In uitvoering",
  done: "Afgerond",
};

const statusIcons: Record<Status, React.ReactNode> = {
  open: <Circle className="h-5 w-5 text-blue-500" />,
  in_progress: <PlayCircle className="h-5 w-5 text-yellow-500" />,
  done: <CheckCircle2 className="h-5 w-5 text-green-500" />,
};

const priorityLabels: Record<Priority, string> = {
  high: "Hoog",
  medium: "Medium",
  low: "Laag",
};

export default function ActionItemDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Form state
  const [description, setDescription] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [status, setStatus] = useState<Status>("open");
  const [notes, setNotes] = useState("");

  const actionItem = useQuery(
    api.actionItems.getById,
    id ? { id: id as Id<"actionItems"> } : "skip"
  );

  const meeting = useQuery(
    api.meetings.getById,
    actionItem?.meetingId ? { id: actionItem.meetingId } : "skip"
  );

  const updateActionItem = useMutation(api.actionItems.update);
  const updateStatus = useMutation(api.actionItems.updateStatus);
  const removeActionItem = useMutation(api.actionItems.remove);

  // Initialize form when data loads
  useEffect(() => {
    if (actionItem) {
      setDescription(actionItem.description);
      setOwnerName(actionItem.ownerName || "");
      setDeadline(
        actionItem.deadline
          ? format(new Date(actionItem.deadline), "yyyy-MM-dd")
          : ""
      );
      setPriority(actionItem.priority || "medium");
      setStatus(actionItem.status);
      setNotes(actionItem.notes || "");
    }
  }, [actionItem]);

  const handleSave = async () => {
    if (!actionItem) return;

    setIsSaving(true);
    try {
      await updateActionItem({
        id: actionItem._id,
        description,
        ownerName: ownerName || undefined,
        deadline: deadline ? new Date(deadline).getTime() : undefined,
        notes: notes || undefined,
      });

      // Update status separately if changed
      if (status !== actionItem.status) {
        await updateStatus({
          id: actionItem._id,
          status,
        });
      }

      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickStatusChange = async (newStatus: Status) => {
    if (!actionItem) return;
    await updateStatus({ id: actionItem._id, status: newStatus });
    setStatus(newStatus);
  };

  const handleDelete = async () => {
    if (!actionItem) return;

    setIsDeleting(true);
    try {
      await removeActionItem({ id: actionItem._id });
      router.push("/actiepunten");
    } catch (err) {
      console.error("Delete error:", err);
      setIsDeleting(false);
    }
  };

  const now = Date.now();
  const isOverdue =
    actionItem?.deadline &&
    actionItem.deadline < now &&
    actionItem.status !== "done";

  if (!actionItem) {
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
            <Link href="/actiepunten">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              {statusIcons[actionItem.status]}
              <h1 className="text-2xl font-bold">Actiepunt</h1>
              {isOverdue && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Verlopen
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Annuleren
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Opslaan
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Bewerken
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Beschrijving</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                ) : (
                  <p className="whitespace-pre-wrap">{actionItem.description}</p>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notities</CardTitle>
                <CardDescription>
                  Extra informatie of updates over dit actiepunt
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Voeg notities toe..."
                  />
                ) : notes ? (
                  <p className="whitespace-pre-wrap">{notes}</p>
                ) : (
                  <p className="text-muted-foreground">Geen notities</p>
                )}
              </CardContent>
            </Card>

            {/* Source Meeting */}
            {meeting && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Bron vergadering
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Link
                    href={`/vergaderingen/${meeting._id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{meeting.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(meeting.date), "EEEE d MMMM yyyy", {
                          locale: nl,
                        })}
                      </p>
                    </div>
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Select
                    value={status}
                    onValueChange={(value) => setStatus(value as Status)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In uitvoering</SelectItem>
                      <SelectItem value="done">Afgerond</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-lg font-medium">
                      {statusIcons[actionItem.status]}
                      {statusLabels[actionItem.status]}
                    </div>
                    <div className="flex gap-2">
                      {actionItem.status !== "done" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickStatusChange("done")}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Markeer als afgerond
                        </Button>
                      )}
                      {actionItem.status === "open" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickStatusChange("in_progress")}
                        >
                          <PlayCircle className="mr-2 h-4 w-4" />
                          Start
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Owner */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Verantwoordelijke
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Input
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Naam verantwoordelijke"
                  />
                ) : (
                  <p>{actionItem.ownerName || "Niet toegewezen"}</p>
                )}
              </CardContent>
            </Card>

            {/* Deadline */}
            <Card className={isOverdue ? "border-destructive" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Deadline
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                ) : actionItem.deadline ? (
                  <div>
                    <p
                      className={`font-medium ${
                        isOverdue ? "text-destructive" : ""
                      }`}
                    >
                      {format(new Date(actionItem.deadline), "EEEE d MMMM yyyy", {
                        locale: nl,
                      })}
                    </p>
                    {isOverdue && (
                      <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                        <AlertTriangle className="h-3 w-3" />
                        Deze deadline is verlopen
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Geen deadline</p>
                )}
              </CardContent>
            </Card>

            {/* Priority */}
            <Card>
              <CardHeader>
                <CardTitle>Prioriteit</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Select
                    value={priority}
                    onValueChange={(value) => setPriority(value as Priority)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Hoog</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Laag</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge
                    variant={
                      actionItem.priority === "high"
                        ? "destructive"
                        : actionItem.priority === "medium"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {priorityLabels[actionItem.priority || "medium"]}
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Meta Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Informatie
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Aangemaakt</span>
                  <span>
                    {format(new Date(actionItem.createdAt), "d MMM yyyy HH:mm", {
                      locale: nl,
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Laatst gewijzigd</span>
                  <span>
                    {format(new Date(actionItem.updatedAt), "d MMM yyyy HH:mm", {
                      locale: nl,
                    })}
                  </span>
                </div>
                {actionItem.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Afgerond</span>
                    <span>
                      {format(
                        new Date(actionItem.completedAt),
                        "d MMM yyyy HH:mm",
                        { locale: nl }
                      )}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actiepunt verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je dit actiepunt wilt verwijderen? Dit kan niet
              ongedaan worden gemaakt.
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
