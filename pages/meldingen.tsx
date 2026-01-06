import { useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  CheckSquare,
  Calendar,
  FileText,
  Clock,
  AlertTriangle,
  CheckCheck,
  Settings,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow as fnsFormatDistanceToNow, format } from "date-fns";
import { nl } from "date-fns/locale";

function formatDistanceToNow(timestamp: number): string {
  return fnsFormatDistanceToNow(new Date(timestamp), {
    addSuffix: true,
    locale: nl,
  });
}

export default function MeldingenPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

  // Get current user from Convex
  const convexUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Get all notifications
  const allNotifications = useQuery(
    api.notifications.listForUser,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  // Get unread notifications
  const unreadNotifications = useQuery(
    api.notifications.listForUser,
    convexUser?._id ? { userId: convexUser._id, unreadOnly: true } : "skip"
  );

  // Mutations
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const deleteNotification = useMutation(api.notifications.deleteNotification);

  const notifications = activeTab === "unread" ? unreadNotifications : allNotifications;
  const unreadCount = unreadNotifications?.length || 0;

  // Handle mark as read
  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead({ notificationId: notificationId as any });
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    if (convexUser?._id) {
      await markAllAsRead({ userId: convexUser._id });
    }
  };

  // Handle delete notification
  const handleDelete = async (notificationId: string) => {
    await deleteNotification({ notificationId: notificationId as any });
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "action_item_assigned":
        return <CheckSquare className="h-5 w-5 text-blue-500" />;
      case "action_item_deadline":
        return <Clock className="h-5 w-5 text-amber-500" />;
      case "action_item_overdue":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "meeting_scheduled":
      case "meeting_reminder":
        return <Calendar className="h-5 w-5 text-green-500" />;
      case "transcription_completed":
        return <FileText className="h-5 w-5 text-purple-500" />;
      case "report_ready":
        return <FileText className="h-5 w-5 text-indigo-500" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  // Get notification link
  const getNotificationLink = (notification: any): string => {
    if (notification.actionItem) {
      return `/actiepunten/${notification.actionItem._id}`;
    }
    if (notification.meeting) {
      return `/vergaderingen/${notification.meeting._id}`;
    }
    if (notification.report) {
      return `/rapportages/${notification.report._id}`;
    }
    return "#";
  };

  // Get notification type label
  const getTypeLabel = (type: string): string => {
    switch (type) {
      case "action_item_assigned":
        return "Toegewezen";
      case "action_item_deadline":
        return "Deadline";
      case "action_item_overdue":
        return "Verlopen";
      case "meeting_scheduled":
        return "Gepland";
      case "meeting_reminder":
        return "Herinnering";
      case "transcription_completed":
        return "Transcriptie";
      case "report_ready":
        return "Rapport";
      default:
        return "Melding";
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Meldingen</h1>
            <p className="text-muted-foreground mt-1">
              {unreadCount > 0
                ? `${unreadCount} ongelezen melding${unreadCount > 1 ? "en" : ""}`
                : "Geen ongelezen meldingen"}
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" onClick={handleMarkAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-2" />
                Alles als gelezen markeren
              </Button>
            )}
            <Link href="/instellingen/meldingen">
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Voorkeuren
              </Button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "unread")}>
          <TabsList>
            <TabsTrigger value="all">
              Alle meldingen
              {allNotifications && allNotifications.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {allNotifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread">
              Ongelezen
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {!notifications || notifications.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium">
                    {activeTab === "unread"
                      ? "Geen ongelezen meldingen"
                      : "Geen meldingen"}
                  </p>
                  <p className="text-muted-foreground mt-1">
                    {activeTab === "unread"
                      ? "Je hebt alle meldingen gelezen"
                      : "Je hebt nog geen meldingen ontvangen"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {notifications.map((notification) => (
                      <div
                        key={String(notification._id)}
                        className={`p-4 flex items-start gap-4 ${
                          !notification.read ? "bg-muted/30" : ""
                        }`}
                      >
                        {/* Icon */}
                        <div className="mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Link
                              href={getNotificationLink(notification)}
                              className={`font-medium hover:underline ${
                                !notification.read ? "text-foreground" : "text-muted-foreground"
                              }`}
                              onClick={() => handleMarkAsRead(String(notification._id))}
                            >
                              {notification.title}
                            </Link>
                            <Badge variant="outline" className="text-xs">
                              {getTypeLabel(notification.type)}
                            </Badge>
                            {!notification.read && (
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(notification.createdAt)} •{" "}
                            {format(new Date(notification.createdAt), "d MMMM yyyy HH:mm", {
                              locale: nl,
                            })}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(String(notification._id))}
                              title="Markeer als gelezen"
                            >
                              <CheckCheck className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(String(notification._id))}
                            title="Verwijderen"
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
