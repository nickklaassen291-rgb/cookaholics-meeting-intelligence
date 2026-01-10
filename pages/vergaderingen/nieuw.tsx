import { useState } from "react";
import { useRouter } from "next/router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Users, X } from "lucide-react";
import Link from "next/link";

export default function NieuweVergaderingPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleDepartment = (deptId: string) => {
    setSelectedDepartments((prev) =>
      prev.includes(deptId)
        ? prev.filter((id) => id !== deptId)
        : [...prev, deptId]
    );
  };

  const toggleAttendee = (userId: string) => {
    setSelectedAttendees((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const departments = useQuery(api.departments.list, {});
  const meetingTypes = useQuery(api.meetingTypes.list, {});
  const users = useQuery(api.users.list, {});
  const createMeeting = useMutation(api.meetings.create);

  // Filter users by selected departments
  const filteredUsers = users?.filter((user) => {
    if (selectedDepartments.length === 0) return true;
    return selectedDepartments.includes(user.departmentId) || user.isMT;
  }) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !selectedType || selectedDepartments.length === 0 || !date) return;

    setIsSubmitting(true);
    try {
      const [hours, minutes] = time.split(":").map(Number);
      const meetingDate = new Date(date);
      meetingDate.setHours(hours, minutes, 0, 0);

      await createMeeting({
        title,
        meetingTypeId: selectedType as Id<"meetingTypes">,
        date: meetingDate.getTime(),
        duration,
        departmentIds: selectedDepartments as Id<"departments">[],
        attendeeIds: selectedAttendees as Id<"users">[],
      });

      router.push("/vergaderingen");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/vergaderingen">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Nieuwe vergadering</h1>
            <p className="text-muted-foreground">Plan een nieuwe vergadering</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titel</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Bijv. Wekelijks overleg"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer type" />
                  </SelectTrigger>
                  <SelectContent>
                    {meetingTypes?.map((type) => (
                      <SelectItem key={type._id} value={type._id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Afdeling(en)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {departments?.map((dept) => (
                    <label
                      key={dept._id}
                      className="flex items-center space-x-2 rounded-lg border p-3 cursor-pointer hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDepartments.includes(dept._id)}
                        onChange={() => toggleDepartment(dept._id)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm font-medium">{dept.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Datum</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Tijd</Label>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duur (minuten)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  min={5}
                  max={480}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Deelnemers
                </Label>
                {selectedAttendees.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedAttendees.map((userId) => {
                      const user = users?.find((u) => u._id === userId);
                      return user ? (
                        <Badge key={userId} variant="secondary" className="pr-1">
                          {user.name}
                          <button
                            type="button"
                            onClick={() => toggleAttendee(userId)}
                            className="ml-1 hover:bg-muted rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                  {filteredUsers.length === 0 ? (
                    <p className="col-span-2 text-sm text-muted-foreground text-center py-4">
                      Selecteer eerst een afdeling
                    </p>
                  ) : (
                    filteredUsers.map((user) => (
                      <label
                        key={user._id}
                        className="flex items-center space-x-2 rounded-lg border p-2 cursor-pointer hover:bg-muted"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAttendees.includes(user._id)}
                          onChange={() => toggleAttendee(user._id)}
                          className="h-4 w-4"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium block truncate">{user.name}</span>
                          <span className="text-xs text-muted-foreground block truncate">{user.email}</span>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedAttendees.length} deelnemer(s) geselecteerd
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
                  Annuleren
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Aanmaken
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </Layout>
  );
}
