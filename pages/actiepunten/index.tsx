import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckSquare,
  Loader2,
  AlertTriangle,
  Clock,
  User,
  Calendar,
  Filter,
  CheckCircle2,
  Circle,
  PlayCircle,
  Search,
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
  open: <Circle className="h-4 w-4" />,
  in_progress: <PlayCircle className="h-4 w-4" />,
  done: <CheckCircle2 className="h-4 w-4" />,
};

const priorityLabels: Record<Priority, string> = {
  high: "Hoog",
  medium: "Medium",
  low: "Laag",
};

export default function ActiepuntenPage() {
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<Id<"actionItems">>>(new Set());
  const [isUpdating, setIsUpdating] = useState(false);

  const actionItems = useQuery(api.actionItems.list, {
    status: statusFilter !== "all" ? statusFilter : undefined,
    priority: priorityFilter !== "all" ? priorityFilter : undefined,
  });

  const updateStatus = useMutation(api.actionItems.updateStatus);
  const bulkUpdateStatus = useMutation(api.actionItems.bulkUpdateStatus);
  const updateActionItem = useMutation(api.actionItems.update);

  const now = Date.now();

  const handleDeadlineChange = async (id: Id<"actionItems">, dateString: string) => {
    const deadline = dateString ? new Date(dateString).getTime() : undefined;
    await updateActionItem({ id, deadline });
  };

  // Filter by search query
  const filteredItems = actionItems?.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.description.toLowerCase().includes(query) ||
      item.ownerName?.toLowerCase().includes(query)
    );
  });

  const handleToggleSelect = (id: Id<"actionItems">) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (!filteredItems) return;
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map((item) => item._id)));
    }
  };

  const handleBulkUpdate = async (status: Status) => {
    if (selectedItems.size === 0) return;
    setIsUpdating(true);
    try {
      await bulkUpdateStatus({
        ids: Array.from(selectedItems),
        status,
      });
      setSelectedItems(new Set());
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuickStatusChange = async (id: Id<"actionItems">, status: Status) => {
    await updateStatus({ id, status });
  };

  const isOverdue = (deadline: number | undefined) => {
    return deadline && deadline < now;
  };

  // Group stats
  const stats = {
    total: actionItems?.length || 0,
    open: actionItems?.filter((i) => i.status === "open").length || 0,
    inProgress: actionItems?.filter((i) => i.status === "in_progress").length || 0,
    done: actionItems?.filter((i) => i.status === "done").length || 0,
    overdue: actionItems?.filter((i) => i.status !== "done" && isOverdue(i.deadline)).length || 0,
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Actiepunten</h1>
            <p className="text-muted-foreground">
              Beheer alle actiepunten uit vergaderingen
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Totaal</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
              <p className="text-xs text-muted-foreground">Open</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
              <p className="text-xs text-muted-foreground">In uitvoering</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{stats.done}</div>
              <p className="text-xs text-muted-foreground">Afgerond</p>
            </CardContent>
          </Card>
          <Card className={stats.overdue > 0 ? "border-destructive" : ""}>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-destructive">{stats.overdue}</div>
              <p className="text-xs text-muted-foreground">Verlopen</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>

              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Zoeken..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as Status | "all")}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statussen</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In uitvoering</SelectItem>
                  <SelectItem value="done">Afgerond</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={priorityFilter}
                onValueChange={(value) => setPriorityFilter(value as Priority | "all")}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Prioriteit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle prioriteiten</SelectItem>
                  <SelectItem value="high">Hoog</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Laag</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedItems.size > 0 && (
          <Card className="border-primary">
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                  {selectedItems.size} geselecteerd
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkUpdate("open")}
                    disabled={isUpdating}
                  >
                    Open
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkUpdate("in_progress")}
                    disabled={isUpdating}
                  >
                    In uitvoering
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkUpdate("done")}
                    disabled={isUpdating}
                  >
                    Afgerond
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedItems(new Set())}
                >
                  Annuleren
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Items List */}
        {actionItems === undefined ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredItems && filteredItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Geen actiepunten</h3>
              <p className="text-muted-foreground text-center">
                {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
                  ? "Geen actiepunten gevonden met deze filters"
                  : "Er zijn nog geen actiepunten"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {/* Select All Header */}
            <div className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={selectedItems.size === filteredItems?.length && filteredItems.length > 0}
                onChange={handleSelectAll}
                className="h-4 w-4"
              />
              <span>Selecteer alles</span>
            </div>

            {filteredItems?.map((item) => (
              <Card
                key={item._id}
                className={`transition-colors ${
                  isOverdue(item.deadline) && item.status !== "done"
                    ? "border-destructive/50 bg-destructive/5"
                    : ""
                } ${selectedItems.has(item._id) ? "ring-2 ring-primary" : ""}`}
              >
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item._id)}
                      onChange={() => handleToggleSelect(item._id)}
                      className="mt-1 h-4 w-4"
                    />

                    <div className="flex-1 min-w-0">
                      <Link href={`/actiepunten/${item._id}`}>
                        <p className="font-medium hover:text-primary transition-colors">
                          {item.description}
                        </p>
                      </Link>

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                        {item.ownerName && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {item.ownerName}
                          </span>
                        )}
                        <span
                          className={`flex items-center gap-1 ${
                            isOverdue(item.deadline) && item.status !== "done"
                              ? "text-destructive font-medium"
                              : ""
                          }`}
                        >
                          {isOverdue(item.deadline) && item.status !== "done" ? (
                            <AlertTriangle className="h-3 w-3" />
                          ) : (
                            <Calendar className="h-3 w-3" />
                          )}
                          <Input
                            type="date"
                            value={item.deadline ? format(new Date(item.deadline), "yyyy-MM-dd") : ""}
                            onChange={(e) => handleDeadlineChange(item._id, e.target.value)}
                            className="h-6 w-[130px] text-xs px-2"
                            placeholder="Deadline"
                          />
                          {isOverdue(item.deadline) && item.status !== "done" && (
                            <span className="text-xs">(verlopen)</span>
                          )}
                        </span>
                        <Link
                          href={`/vergaderingen/${item.meetingId}`}
                          className="text-xs hover:text-primary"
                        >
                          Bron vergadering →
                        </Link>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          item.priority === "high"
                            ? "destructive"
                            : item.priority === "medium"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {priorityLabels[item.priority || "medium"]}
                      </Badge>

                      <Select
                        value={item.status}
                        onValueChange={(value) =>
                          handleQuickStatusChange(item._id, value as Status)
                        }
                      >
                        <SelectTrigger className="w-[140px]">
                          <div className="flex items-center gap-2">
                            {statusIcons[item.status]}
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">
                            <div className="flex items-center gap-2">
                              <Circle className="h-4 w-4" />
                              Open
                            </div>
                          </SelectItem>
                          <SelectItem value="in_progress">
                            <div className="flex items-center gap-2">
                              <PlayCircle className="h-4 w-4" />
                              In uitvoering
                            </div>
                          </SelectItem>
                          <SelectItem value="done">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4" />
                              Afgerond
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
