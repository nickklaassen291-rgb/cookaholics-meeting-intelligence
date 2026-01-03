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
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Clock, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function NieuweVergaderingPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [duration, setDuration] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const departments = useQuery(api.departments.list, {});
  const meetingTypes = useQuery(api.meetingTypes.list, {});
  const users = useQuery(api.users.list, {});
  const createMeeting = useMutation(api.meetings.create);

  // When meeting type changes, auto-fill duration
  const handleTypeChange = (typeId: string) => {
    setSelectedType(typeId);
    const type = meetingTypes?.find((t) => t._id === typeId);
    if (type) {
      setDuration(type.defaultDuration);
    }
  };

  // Toggle department selection
  const toggleDepartment = (deptId: string) => {
    setSelectedDepartments((prev) =>
      prev.includes(deptId)
        ? prev.filter((id) => id !== deptId)
        : [...prev, deptId]
    );
  };

  // Get users for selected departments
  const availableUsers = users?.filter((user) =>
    selectedDepartments.includes(user.departmentId)
  ) || [];

  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);

  const toggleAttendee = (userId: string) => {
    setSelectedAttendees((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: "Fout",
        description: "Vul een titel in voor de vergadering",
        variant: "destructive",
      });
      return;
    }

    if (!selectedType) {
      toast({
        title: "Fout",
        description: "Selecteer een type vergadering",
        variant: "destructive",
      });
      return;
    }

    if (selectedDepartments.length === 0) {
      toast({
        title: "Fout",
        description: "Selecteer minimaal één afdeling",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDate) {
      toast({
        title: "Fout",
        description: "Selecteer een datum",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine date and time
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const meetingDate = new Date(selectedDate);
      meetingDate.setHours(hours, minutes, 0, 0);

      // For now, we'll use a placeholder user ID since we don't have real auth yet
      // In production, this would come from the logged-in user
      const firstUser = users?.[0];
      if (!firstUser) {
        toast({
          title: "Fout",
          description: "Geen gebruikers gevonden. Seed eerst de database.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      await createMeeting({
        title,
        meetingTypeId: selectedType as Id<"meetingTypes">,
        date: meetingDate.getTime(),
        duration,
        departmentIds: selectedDepartments as Id<"departments">[],
        attendeeIds: selectedAttendees.length > 0
          ? selectedAttendees as Id<"users">[]
          : [firstUser._id],
        createdById: firstUser._id,
      });

      toast({
        title: "Vergadering aangemaakt",
        description: "De vergadering is succesvol aangemaakt",
      });

      router.push("/vergaderingen");
    } catch (error) {
      console.error("Error creating meeting:", error);
      toast({
        title: "Fout",
        description: "Er is iets misgegaan bij het aanmaken van de vergadering",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/vergaderingen">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nieuwe vergadering</h1>
            <p className="text-muted-foreground">
              Plan een nieuwe vergadering
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Vergadering details</CardTitle>
              <CardDescription>
                Vul de gegevens in voor de nieuwe vergadering
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Titel</Label>
                <Input
                  id="title"
                  placeholder="Bijv. Wekelijks Marketing Overleg"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Meeting Type */}
              <div className="space-y-2">
                <Label>Type vergadering</Label>
                <Select value={selectedType} onValueChange={handleTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer type" />
                  </SelectTrigger>
                  <SelectContent>
                    {meetingTypes?.map((type) => (
                      <SelectItem key={type._id} value={type._id}>
                        {type.name} ({type.defaultDuration} min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Departments */}
              <div className="space-y-2">
                <Label>Afdeling(en)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {departments?.map((dept) => (
                    <div
                      key={dept._id}
                      className={cn(
                        "flex items-center space-x-2 rounded-lg border p-3 cursor-pointer transition-colors",
                        selectedDepartments.includes(dept._id)
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted"
                      )}
                      onClick={() => toggleDepartment(dept._id)}
                    >
                      <Checkbox
                        checked={selectedDepartments.includes(dept._id)}
                        onCheckedChange={() => toggleDepartment(dept._id)}
                      />
                      <span className="text-sm font-medium">{dept.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Datum</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {selectedDate ? (
                          format(selectedDate, "d MMMM yyyy", { locale: nl })
                        ) : (
                          "Selecteer datum"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        locale={nl}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Tijd</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="time"
                      type="time"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration">Duur (minuten)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={5}
                  max={480}
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                />
              </div>

              {/* Attendees */}
              {availableUsers.length > 0 && (
                <div className="space-y-2">
                  <Label>Deelnemers (optioneel)</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {availableUsers.map((user) => (
                      <div
                        key={user._id}
                        className={cn(
                          "flex items-center space-x-2 rounded-lg border p-2 cursor-pointer transition-colors",
                          selectedAttendees.includes(user._id)
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted"
                        )}
                        onClick={() => toggleAttendee(user._id)}
                      >
                        <Checkbox
                          checked={selectedAttendees.includes(user._id)}
                          onCheckedChange={() => toggleAttendee(user._id)}
                        />
                        <span className="text-sm">{user.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push("/vergaderingen")}
                >
                  Annuleren
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Vergadering aanmaken
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </Layout>
  );
}
