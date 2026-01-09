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
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NieuweVergaderingPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
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

  const departments = useQuery(api.departments.list, {});
  const meetingTypes = useQuery(api.meetingTypes.list, {});
  const users = useQuery(api.users.list, {});
  const createMeeting = useMutation(api.meetings.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !selectedType || selectedDepartments.length === 0 || !date) return;

    setIsSubmitting(true);
    try {
      const [hours, minutes] = time.split(":").map(Number);
      const meetingDate = new Date(date);
      meetingDate.setHours(hours, minutes, 0, 0);

      const firstUser = users?.[0];
      if (!firstUser) return;

      await createMeeting({
        title,
        meetingTypeId: selectedType as Id<"meetingTypes">,
        date: meetingDate.getTime(),
        duration,
        departmentIds: selectedDepartments as Id<"departments">[],
        attendeeIds: [firstUser._id],
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
