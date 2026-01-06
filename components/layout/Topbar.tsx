import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Bell, Menu, Search, Calendar, CheckSquare } from "lucide-react";
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
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const router = useRouter();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Quick search results
  const quickResults = useQuery(
    api.search.quickSearch,
    searchQuery.length >= 2 ? { query: searchQuery } : "skip"
  );

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
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              >
                3
              </Badge>
              <span className="sr-only">Meldingen</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Meldingen</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1">
              <span className="font-medium">Actiepunt deadline morgen</span>
              <span className="text-xs text-muted-foreground">
                Q4 marketing budget beoordelen
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1">
              <span className="font-medium">Nieuwe vergadering gepland</span>
              <span className="text-xs text-muted-foreground">
                Wekelijkse Sales Sync - Morgen om 10:00
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1">
              <span className="font-medium">Transcriptie voltooid</span>
              <span className="text-xs text-muted-foreground">
                Marketing Daily - 3 december
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center text-sm text-primary">
              Alle meldingen bekijken
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
