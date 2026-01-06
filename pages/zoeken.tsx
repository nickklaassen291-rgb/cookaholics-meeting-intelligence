import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Calendar,
  FileText,
  CheckSquare,
  Filter,
  X,
  ArrowRight,
  Clock,
  User,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

// Highlight matching text
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query || query.length < 2) {
    return <span>{text}</span>;
  }

  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));

  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

export default function ZoekenPage() {
  const router = useRouter();
  const { q, type, department, from, to } = router.query;

  const [searchQuery, setSearchQuery] = useState((q as string) || "");
  const [searchType, setSearchType] = useState<"all" | "meetings" | "actionItems">(
    (type as "all" | "meetings" | "actionItems") || "all"
  );
  const [selectedDepartment, setSelectedDepartment] = useState<string>(
    (department as string) || "all"
  );
  const [dateFrom, setDateFrom] = useState<string>((from as string) || "");
  const [dateTo, setDateTo] = useState<string>((to as string) || "");
  const [showFilters, setShowFilters] = useState(false);

  // Sync URL params with state
  useEffect(() => {
    if (q) setSearchQuery(q as string);
    if (type) setSearchType(type as "all" | "meetings" | "actionItems");
    if (department) setSelectedDepartment(department as string);
    if (from) setDateFrom(from as string);
    if (to) setDateTo(to as string);
  }, [q, type, department, from, to]);

  // Departments for filter
  const departments = useQuery(api.departments.list);

  // Search results
  const searchResults = useQuery(
    api.search.searchAll,
    searchQuery.length >= 2
      ? {
          query: searchQuery,
          type: searchType,
          departmentId:
            selectedDepartment !== "all"
              ? (selectedDepartment as Id<"departments">)
              : undefined,
          dateFrom: dateFrom ? new Date(dateFrom).getTime() : undefined,
          dateTo: dateTo ? new Date(dateTo).setHours(23, 59, 59, 999) : undefined,
        }
      : "skip"
  );

  // Update URL with search params
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (searchType !== "all") params.set("type", searchType);
    if (selectedDepartment !== "all") params.set("department", selectedDepartment);
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);

    const queryString = params.toString();
    router.replace(`/zoeken${queryString ? `?${queryString}` : ""}`, undefined, {
      shallow: true,
    });
  }, [searchQuery, searchType, selectedDepartment, dateFrom, dateTo, router]);

  // Debounced URL update
  useEffect(() => {
    const timer = setTimeout(updateURL, 300);
    return () => clearTimeout(timer);
  }, [updateURL]);

  const clearFilters = () => {
    setSearchType("all");
    setSelectedDepartment("all");
    setDateFrom("");
    setDateTo("");
  };

  const hasActiveFilters =
    searchType !== "all" || selectedDepartment !== "all" || dateFrom || dateTo;

  const totalResults =
    (searchResults?.meetings?.length || 0) + (searchResults?.actionItems?.length || 0);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Zoeken</h1>
          <p className="text-muted-foreground mt-1">
            Doorzoek vergaderingen, transcripties en actiepunten
          </p>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Zoek op trefwoord..."
                  className="pl-11 h-12 text-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
              <Button
                variant={showFilters ? "default" : "outline"}
                size="lg"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1">
                    {[
                      searchType !== "all" ? 1 : 0,
                      selectedDepartment !== "all" ? 1 : 0,
                      dateFrom ? 1 : 0,
                      dateTo ? 1 : 0,
                    ].reduce((a, b) => a + b, 0)}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Type filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Type</label>
                    <Select
                      value={searchType}
                      onValueChange={(v) => setSearchType(v as typeof searchType)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alles</SelectItem>
                        <SelectItem value="meetings">Vergaderingen</SelectItem>
                        <SelectItem value="actionItems">Actiepunten</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Department filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Afdeling</label>
                    <Select
                      value={selectedDepartment}
                      onValueChange={setSelectedDepartment}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer afdeling" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle afdelingen</SelectItem>
                        {departments?.map((dept) => (
                          <SelectItem key={dept._id} value={dept._id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date from */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Vanaf</label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>

                  {/* Date to */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tot</label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="mt-4 flex justify-end">
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-1" />
                      Filters wissen
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {searchQuery.length < 2 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Voer minimaal 2 tekens in om te zoeken</p>
          </div>
        ) : searchResults === undefined ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p>Zoeken...</p>
          </div>
        ) : totalResults === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Geen resultaten gevonden</p>
            <p className="mt-1">Probeer andere zoektermen of pas de filters aan</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Results summary */}
            <p className="text-muted-foreground">
              {totalResults} resultaten gevonden voor &quot;{searchQuery}&quot;
            </p>

            {/* Meetings results */}
            {searchResults.meetings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Vergaderingen ({searchResults.meetings.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {searchResults.meetings.map((meeting) => (
                      <Link
                        key={meeting._id}
                        href={`/vergaderingen/${meeting._id}`}
                        className="block p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium truncate">
                                <HighlightText
                                  text={meeting.title}
                                  query={searchQuery}
                                />
                              </h3>
                              <Badge variant="outline" className="text-xs shrink-0">
                                {meeting.matchType === "title" && "Titel"}
                                {meeting.matchType === "summary" && "Samenvatting"}
                                {meeting.matchType === "transcription" && "Transcriptie"}
                                {meeting.matchType === "topics" && "Onderwerpen"}
                                {meeting.matchType === "decisions" && "Beslissingen"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {format(new Date(meeting.date), "d MMMM yyyy", {
                                  locale: nl,
                                })}
                              </span>
                              {meeting.meetingType && (
                                <span>{meeting.meetingType.name}</span>
                              )}
                              {meeting.departments.length > 0 && (
                                <span>
                                  {meeting.departments.map((d) => d.name).join(", ")}
                                </span>
                              )}
                            </div>
                            {meeting.matchType === "transcription" &&
                              meeting.transcriptionSnippet && (
                                <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                                  <HighlightText
                                    text={meeting.transcriptionSnippet}
                                    query={searchQuery}
                                  />
                                </p>
                              )}
                            {meeting.matchType === "summary" && meeting.summary && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                <HighlightText
                                  text={meeting.summary}
                                  query={searchQuery}
                                />
                              </p>
                            )}
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action items results */}
            {searchResults.actionItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5" />
                    Actiepunten ({searchResults.actionItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {searchResults.actionItems.map((item) => (
                      <Link
                        key={item._id}
                        href={`/actiepunten/${item._id}`}
                        className="block p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium">
                                <HighlightText
                                  text={item.description}
                                  query={searchQuery}
                                />
                              </h3>
                              <Badge
                                variant={
                                  item.status === "done"
                                    ? "secondary"
                                    : item.status === "in_progress"
                                    ? "default"
                                    : "outline"
                                }
                                className="text-xs shrink-0"
                              >
                                {item.status === "open" && "Open"}
                                {item.status === "in_progress" && "In behandeling"}
                                {item.status === "done" && "Afgerond"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              {item.owner && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3.5 w-3.5" />
                                  {item.owner.name}
                                </span>
                              )}
                              {item.deadline && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  {format(new Date(item.deadline), "d MMM yyyy", {
                                    locale: nl,
                                  })}
                                </span>
                              )}
                              {item.meeting && (
                                <span className="flex items-center gap-1">
                                  <FileText className="h-3.5 w-3.5" />
                                  {item.meeting.title}
                                </span>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
