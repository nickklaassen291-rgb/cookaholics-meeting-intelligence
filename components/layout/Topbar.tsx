import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Bell, Menu, Search, Calendar, CheckSquare, CheckCheck, FileText, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow as fnsFormatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

// Helper to format relative time in Dutch
function formatDistanceToNow(timestamp: number): string {
  return fnsFormatDistanceToNow(new Date(timestamp), {
    addSuffix: true,
    locale: nl,
  });
}

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const router = useRouter();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Get current user from Convex
  const convexUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Get notifications for user
  const notifications = useQuery(
    api.notifications.listForUser,
    convexUser?._id ? { userId: convexUser._id, limit: 5 } : "skip"
  );

  // Get unread count
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  // Mutations
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  // Quick search results
  const quickResults = useQuery(
    api.search.quickSearch,
    searchQuery.length >= 2 ? { query: searchQuery } : "skip"
  );

  // Handle notification click
  const handleNotificationClick = async (notificationId: string, href: string) => {
    await markAsRead({ notificationId: notificationId as any });
    router.push(href);
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    if (convexUser?._id) {
      await markAllAsRead({ userId: convexUser._id });
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "action_item_assigned":
        return <CheckSquare className="h-4 w-4 text-blue-500" />;
      case "action_item_deadline":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "action_item_overdue":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "meeting_scheduled":
      case "meeting_reminder":
        return <Calendar className="h-4 w-4 text-green-500" />;
      case "transcription_completed":
        return <FileText className="h-4 w-4 text-purple-500" />;
      case "report_ready":
        return <FileText className="h-4 w-4 text-indigo-500" />;
      default:
        return <Bell className="h-4 w-4" />;
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
    return "/meldingen";
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/zoeken?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowDropdown(false);
    }
  };

  const hasResults =
    quickResults &&
    (quickResults.meetings.length > 0 || quickResults.actionItems.length > 0);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-card px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Menu openen</span>
      </Button>

      {/* Search */}
      <div className="flex-1 max-w-md" ref={searchRef}>
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Zoek vergaderingen, actiepunten..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(e.target.value.length >= 2);
            }}
            onFocus={() => {
              if (searchQuery.length >= 2) setShowDropdown(true);
            }}
          />

          {/* Quick search dropdown */}
          {showDropdown && searchQuery.length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg z-50 overflow-hidden">
              {!quickResults ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Zoeken...
                </div>
              ) : !hasResults ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Geen resultaten gevonden
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {quickResults.meetings.length > 0 && (
                    <div>
                      <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Vergaderingen
                      </div>
                      {quickResults.meetings.map((meeting) => (
                        <Link
                          key={meeting._id}
                          href={`/vergaderingen/${meeting._id}`}
                          className="block px-3 py-2 hover:bg-muted/50 transition-colors"
                          onClick={() => setShowDropdown(false)}
                        >
                          <p className="text-sm font-medium truncate">{meeting.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(meeting.date), "d MMM yyyy", { locale: nl })}
                          </p>
                        </Link>
                      ))}
                    </div>
                  )}
                  {quickResults.actionItems.length > 0 && (
                    <div>
                      <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50 flex items-center gap-1">
                        <CheckSquare className="h-3 w-3" />
                        Actiepunten
                      </div>
                      {quickResults.actionItems.map((item) => (
                        <Link
                          key={item._id}
                          href={`/actiepunten/${item._id}`}
                          className="block px-3 py-2 hover:bg-muted/50 transition-colors"
                          onClick={() => setShowDropdown(false)}
                        >
                          <p className="text-sm truncate">{item.description}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {item.status === "open" && "Open"}
                            {item.status === "in_progress" && "In behandeling"}
                            {item.status === "done" && "Afgerond"}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  )}
                  {/* View all results link */}
                  <Link
                    href={`/zoeken?q=${encodeURIComponent(searchQuery)}`}
                    className="block px-3 py-2 text-sm text-primary hover:bg-muted/50 transition-colors border-t text-center"
                    onClick={() => setShowDropdown(false)}
                  >
                    Alle resultaten bekijken →
                  </Link>
                </div>
              )}
            </div>
          )}
        </form>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount !== undefined && unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
              <span className="sr-only">Meldingen</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-2">
              <DropdownMenuLabel>Meldingen</DropdownMenuLabel>
              {unreadCount !== undefined && unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto py-1 px-2 text-xs"
                  onClick={handleMarkAllAsRead}
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Alles gelezen
                </Button>
              )}
            </div>
            <DropdownMenuSeparator />
            {!notifications || notifications.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Geen meldingen
              </div>
            ) : (
              notifications.map((notification) => (
                <DropdownMenuItem
                  key={String(notification._id)}
                  className={`flex items-start gap-3 cursor-pointer ${
                    !notification.read ? "bg-muted/50" : ""
                  }`}
                  onClick={() =>
                    handleNotificationClick(
                      String(notification._id),
                      getNotificationLink(notification)
                    )
                  }
                >
                  <div className="mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.read ? "font-medium" : ""}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                  )}
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/meldingen"
                className="w-full text-center text-sm text-primary justify-center"
              >
                Alle meldingen bekijken
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <div className="flex items-center gap-3">
          <div className="hidden md:block text-right">
            <p className="text-sm font-medium">{user?.fullName || "Gebruiker"}</p>
            <p className="text-xs text-muted-foreground">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "h-9 w-9",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
