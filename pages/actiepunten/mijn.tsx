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
  CheckSquare,
  Loader2,
  AlertTriangle,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  Circle,
  PlayCircle,
  Search,
  CalendarDays,
  CalendarClock,
  CalendarRange,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

type Status = "open" | "in_progress" | "done";
type Priority = "high" | "medium" | "low";

const priorityLabels: Record<Priority, string> = {
  high: "Hoog",
  medium: "Medium",
  low: "Laag",
};

interface ActionItem {
  _id: Id<"actionItems">;
  description: string;
  ownerName?: string;
  deadline?: number;
  priority?: Priority;
  status: Status;
  meetingId: Id<"meetings">;
  createdAt: number;
}

function ActionItemCard({
  item,
  onStatusChange,
}: {
  item: ActionItem;
  onStatusChange: (id: Id<"actionItems">, status: Status) => void;
}) {
  const isOverdue = item.deadline && item.deadline < Date.now() && item.status !== "done";

  return (
    <Card
      className={`transition-colors ${
        isOverdue ? "border-destructive/50 bg-destructive/5" : ""
      }`}
    >
      <CardContent className="py-3">
        <div className="flex items-start gap-3">
          <button
            onClick={() =>
              onStatusChange(
                item._id,
                item.status === "done" ? "open" : "done"
              )
            }
            className="mt-0.5 text-muted-foreground hover:text-primary transition-colors"
          >
            {item.status === "done" ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : item.status === "in_progress" ? (
              <PlayCircle className="h-5 w-5 text-yellow-500" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <Link href={`/actiepunten/${item._id}`}>
              <p
                className={`font-medium hover:text-primary transition-colors ${
                  item.status === "done" ? "line-through text-muted-foreground" : ""
                }`}
              >
                {item.description}
              </p>
            </Link>

            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
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
              <Link
                href={`/vergaderingen/${item.meetingId}`}
                className="hover:text-primary"
              >
                Bron →
              </Link>
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
        </div>
      </CardContent>
    </Card>
  );
}

function ActionItemGroup({
  title,
  icon,
  items,
  variant = "default",
  onStatusChange,
}: {
  title: string;
  icon: React.ReactNode;
  items: ActionItem[];
  variant?: "default" | "danger" | "warning";
  onStatusChange: (id: Id<"actionItems">, status: Status) => void;
}) {
  if (items.length === 0) return null;

  const variantStyles = {
    default: "",
    danger: "border-destructive/50",
    warning: "border-yellow-500/50",
  };

  return (
    <Card className={variantStyles[variant]}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
          <Badge variant="secondary" className="ml-2">
            {items.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <ActionItemCard
            key={item._id}
            item={item}
            onStatusChange={onStatusChange}
          />
        ))}
      </CardContent>
    </Card>
  );
}

export default function MijnActiepuntenPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const groupedItems = useQuery(api.actionItems.listGroupedByDeadline, {});
  const updateStatus = useMutation(api.actionItems.updateStatus);

  const handleStatusChange = async (id: Id<"actionItems">, status: Status) => {
    await updateStatus({ id, status });
  };

  // Filter by search
  const filterItems = (items: ActionItem[]) => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.description.toLowerCase().includes(query) ||
        item.ownerName?.toLowerCase().includes(query)
    );
  };

  const totalOpen =
    (groupedItems?.overdue.length || 0) +
    (groupedItems?.today.length || 0) +
    (groupedItems?.thisWeek.length || 0) +
    (groupedItems?.later.length || 0) +
    (groupedItems?.noDeadline.length || 0);

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mijn Actiepunten</h1>
            <p className="text-muted-foreground">
              {totalOpen} openstaande actiepunten
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/actiepunten">Alle actiepunten →</Link>
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoeken in actiepunten..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {groupedItems === undefined ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : totalOpen === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="font-semibold text-lg mb-2">Alles afgerond!</h3>
              <p className="text-muted-foreground text-center">
                Je hebt geen openstaande actiepunten
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Overdue */}
            <ActionItemGroup
              title="Verlopen"
              icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
              items={filterItems(groupedItems.overdue)}
              variant="danger"
              onStatusChange={handleStatusChange}
            />

            {/* Today */}
            <ActionItemGroup
              title="Vandaag"
              icon={<CalendarDays className="h-5 w-5 text-yellow-500" />}
              items={filterItems(groupedItems.today)}
              variant="warning"
              onStatusChange={handleStatusChange}
            />

            {/* This Week */}
            <ActionItemGroup
              title="Deze week"
              icon={<CalendarClock className="h-5 w-5 text-blue-500" />}
              items={filterItems(groupedItems.thisWeek)}
              onStatusChange={handleStatusChange}
            />

            {/* Later */}
            <ActionItemGroup
              title="Later"
              icon={<CalendarRange className="h-5 w-5 text-muted-foreground" />}
              items={filterItems(groupedItems.later)}
              onStatusChange={handleStatusChange}
            />

            {/* No Deadline */}
            <ActionItemGroup
              title="Geen deadline"
              icon={<Clock className="h-5 w-5 text-muted-foreground" />}
              items={filterItems(groupedItems.noDeadline)}
              onStatusChange={handleStatusChange}
            />
          </div>
        )}
      </div>
    </Layout>
  );
}
