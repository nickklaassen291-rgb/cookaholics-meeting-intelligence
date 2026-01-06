import { v } from "convex/values";
import { query } from "./_generated/server";

// Search across meetings, transcriptions, summaries, and action items
export const searchAll = query({
  args: {
    query: v.string(),
    departmentId: v.optional(v.id("departments")),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    type: v.optional(v.union(
      v.literal("all"),
      v.literal("meetings"),
      v.literal("actionItems")
    )),
  },
  handler: async (ctx, args) => {
    const searchQuery = args.query.toLowerCase().trim();

    if (searchQuery.length < 2) {
      return { meetings: [], actionItems: [] };
    }

    const results: {
      meetings: Array<{
        _id: string;
        title: string;
        date: number;
        summary: string | null;
        transcriptionSnippet: string | null;
        matchType: "title" | "summary" | "transcription" | "topics" | "decisions";
        departments: Array<{ _id: string; name: string; slug: string }>;
        meetingType: { name: string } | null;
      }>;
      actionItems: Array<{
        _id: string;
        description: string;
        status: string;
        deadline: number | null;
        owner: { name: string } | null;
        meeting: { _id: string; title: string; date: number } | null;
        matchType: "description" | "notes";
      }>;
    } = { meetings: [], actionItems: [] };

    // Search meetings
    if (args.type === "all" || args.type === "meetings" || !args.type) {
      const meetings = await ctx.db.query("meetings").collect();

      for (const meeting of meetings) {
        // Apply date filters
        if (args.dateFrom && meeting.date < args.dateFrom) continue;
        if (args.dateTo && meeting.date > args.dateTo) continue;

        // Apply department filter
        if (args.departmentId && !meeting.departmentIds.includes(args.departmentId)) continue;

        let matchType: "title" | "summary" | "transcription" | "topics" | "decisions" | null = null;
        let transcriptionSnippet: string | null = null;

        // Search in title
        if (meeting.title.toLowerCase().includes(searchQuery)) {
          matchType = "title";
        }
        // Search in summary
        else if (meeting.summary?.toLowerCase().includes(searchQuery)) {
          matchType = "summary";
        }
        // Search in transcription
        else if (meeting.transcription?.toLowerCase().includes(searchQuery)) {
          matchType = "transcription";
          // Get snippet around the match
          const index = meeting.transcription.toLowerCase().indexOf(searchQuery);
          const start = Math.max(0, index - 50);
          const end = Math.min(meeting.transcription.length, index + searchQuery.length + 50);
          transcriptionSnippet = (start > 0 ? "..." : "") +
            meeting.transcription.slice(start, end) +
            (end < meeting.transcription.length ? "..." : "");
        }
        // Search in topics
        else if (meeting.topics?.some(t => t.toLowerCase().includes(searchQuery))) {
          matchType = "topics";
        }
        // Search in decisions
        else if (meeting.decisions?.some(d => d.description.toLowerCase().includes(searchQuery))) {
          matchType = "decisions";
        }

        if (matchType) {
          // Get departments
          const departmentsData = await Promise.all(
            meeting.departmentIds.map(async (id) => {
              const dept = await ctx.db.get(id);
              return dept ? { _id: String(dept._id), name: dept.name, slug: dept.slug } : null;
            })
          );
          const filteredDepartments = departmentsData.filter(
            (d): d is { _id: string; name: string; slug: string } => d !== null
          );

          // Get meeting type
          const meetingType = await ctx.db.get(meeting.meetingTypeId);

          results.meetings.push({
            _id: String(meeting._id),
            title: meeting.title,
            date: meeting.date,
            summary: meeting.summary || null,
            transcriptionSnippet,
            matchType,
            departments: filteredDepartments,
            meetingType: meetingType ? { name: meetingType.name } : null,
          });
        }
      }
    }

    // Search action items
    if (args.type === "all" || args.type === "actionItems" || !args.type) {
      const actionItems = await ctx.db.query("actionItems").collect();

      for (const item of actionItems) {
        let matchType: "description" | "notes" | null = null;

        // Search in description
        if (item.description.toLowerCase().includes(searchQuery)) {
          matchType = "description";
        }
        // Search in notes
        else if (item.notes?.toLowerCase().includes(searchQuery)) {
          matchType = "notes";
        }

        if (matchType) {
          // Get meeting info
          const meeting = await ctx.db.get(item.meetingId);

          // Apply date filter based on meeting date
          if (meeting) {
            if (args.dateFrom && meeting.date < args.dateFrom) continue;
            if (args.dateTo && meeting.date > args.dateTo) continue;

            // Apply department filter
            if (args.departmentId && !meeting.departmentIds.includes(args.departmentId)) continue;
          }

          // Get owner info
          let owner: { name: string } | null = null;
          if (item.ownerId) {
            const ownerUser = await ctx.db.get(item.ownerId);
            if (ownerUser) {
              owner = { name: ownerUser.name };
            }
          } else if (item.ownerName) {
            owner = { name: item.ownerName };
          }

          results.actionItems.push({
            _id: String(item._id),
            description: item.description,
            status: item.status,
            deadline: item.deadline || null,
            owner,
            meeting: meeting ? { _id: String(meeting._id), title: meeting.title, date: meeting.date } : null,
            matchType,
          });
        }
      }
    }

    // Sort meetings by date (newest first)
    results.meetings.sort((a, b) => b.date - a.date);

    // Sort action items by deadline (soonest first), then by meeting date
    results.actionItems.sort((a, b) => {
      if (a.deadline && b.deadline) return a.deadline - b.deadline;
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      if (a.meeting && b.meeting) return b.meeting.date - a.meeting.date;
      return 0;
    });

    return results;
  },
});

// Quick search for autocomplete (lightweight)
export const quickSearch = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const searchQuery = args.query.toLowerCase().trim();

    if (searchQuery.length < 2) {
      return { meetings: [], actionItems: [] };
    }

    // Get top 5 matching meetings
    const meetings = await ctx.db.query("meetings").collect();
    const matchingMeetings = meetings
      .filter(m =>
        m.title.toLowerCase().includes(searchQuery) ||
        m.summary?.toLowerCase().includes(searchQuery)
      )
      .slice(0, 5)
      .map(m => ({
        _id: String(m._id),
        title: m.title,
        date: m.date,
      }));

    // Get top 5 matching action items
    const actionItems = await ctx.db.query("actionItems").collect();
    const matchingActionItems = actionItems
      .filter(a => a.description.toLowerCase().includes(searchQuery))
      .slice(0, 5)
      .map(a => ({
        _id: String(a._id),
        description: a.description,
        status: a.status,
      }));

    return {
      meetings: matchingMeetings,
      actionItems: matchingActionItems,
    };
  },
});
