import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  Mail,
  Smartphone,
  Clock,
  Save,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export default function MeldingenInstellingenPage() {
  const { user } = useUser();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Get current user from Convex
  const convexUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Get preferences
  const preferences = useQuery(
    api.notifications.getPreferences,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  // Update mutation
  const updatePreferences = useMutation(api.notifications.updatePreferences);

  // Local state for form
  const [formData, setFormData] = useState({
    emailActionItemAssigned: true,
    emailActionItemDeadline: true,
    emailActionItemOverdue: true,
    emailMeetingReminder: true,
    emailWeeklyDigest: true,
    inAppActionItemAssigned: true,
    inAppActionItemDeadline: true,
    inAppActionItemOverdue: true,
    inAppMeetingReminder: true,
    deadlineReminderDays: 1,
    meetingReminderMinutes: 30,
  });

  // Update form when preferences load
  useEffect(() => {
    if (preferences) {
      setFormData({
        emailActionItemAssigned: preferences.emailActionItemAssigned,
        emailActionItemDeadline: preferences.emailActionItemDeadline,
        emailActionItemOverdue: preferences.emailActionItemOverdue,
        emailMeetingReminder: preferences.emailMeetingReminder,
        emailWeeklyDigest: preferences.emailWeeklyDigest,
        inAppActionItemAssigned: preferences.inAppActionItemAssigned,
        inAppActionItemDeadline: preferences.inAppActionItemDeadline,
        inAppActionItemOverdue: preferences.inAppActionItemOverdue,
        inAppMeetingReminder: preferences.inAppMeetingReminder,
        deadlineReminderDays: preferences.deadlineReminderDays,
        meetingReminderMinutes: preferences.meetingReminderMinutes,
      });
    }
  }, [preferences]);

  const handleSave = async () => {
    if (!convexUser?._id) return;

    setSaving(true);
    try {
      await updatePreferences({
        userId: convexUser._id,
        ...formData,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Failed to save preferences:", error);
    }
    setSaving(false);
  };

  const handleToggle = (field: keyof typeof formData) => {
    setFormData((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/meldingen">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Meldingsvoorkeuren</h1>
            <p className="text-muted-foreground mt-1">
              Beheer hoe en wanneer je meldingen ontvangt
            </p>
          </div>
        </div>

        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              E-mail meldingen
            </CardTitle>
            <CardDescription>
              Ontvang meldingen per e-mail
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Nieuw actiepunt toegewezen</Label>
                <p className="text-sm text-muted-foreground">
                  E-mail wanneer een actiepunt aan je wordt toegewezen
                </p>
              </div>
              <Switch
                checked={formData.emailActionItemAssigned}
                onCheckedChange={() => handleToggle("emailActionItemAssigned")}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Deadline herinnering</Label>
                <p className="text-sm text-muted-foreground">
                  E-mail wanneer een deadline nadert
                </p>
              </div>
              <Switch
                checked={formData.emailActionItemDeadline}
                onCheckedChange={() => handleToggle("emailActionItemDeadline")}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Verlopen actiepunten</Label>
                <p className="text-sm text-muted-foreground">
                  E-mail wanneer een actiepunt over de deadline is
                </p>
              </div>
              <Switch
                checked={formData.emailActionItemOverdue}
                onCheckedChange={() => handleToggle("emailActionItemOverdue")}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Vergadering herinnering</Label>
                <p className="text-sm text-muted-foreground">
                  E-mail herinnering voor aankomende vergaderingen
                </p>
              </div>
              <Switch
                checked={formData.emailMeetingReminder}
                onCheckedChange={() => handleToggle("emailMeetingReminder")}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Wekelijkse samenvatting</Label>
                <p className="text-sm text-muted-foreground">
                  Wekelijks overzicht van je actiepunten en vergaderingen
                </p>
              </div>
              <Switch
                checked={formData.emailWeeklyDigest}
                onCheckedChange={() => handleToggle("emailWeeklyDigest")}
              />
            </div>
          </CardContent>
        </Card>

        {/* In-App Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              In-app meldingen
            </CardTitle>
            <CardDescription>
              Meldingen in de applicatie
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Nieuw actiepunt toegewezen</Label>
                <p className="text-sm text-muted-foreground">
                  Melding wanneer een actiepunt aan je wordt toegewezen
                </p>
              </div>
              <Switch
                checked={formData.inAppActionItemAssigned}
                onCheckedChange={() => handleToggle("inAppActionItemAssigned")}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Deadline herinnering</Label>
                <p className="text-sm text-muted-foreground">
                  Melding wanneer een deadline nadert
                </p>
              </div>
              <Switch
                checked={formData.inAppActionItemDeadline}
                onCheckedChange={() => handleToggle("inAppActionItemDeadline")}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Verlopen actiepunten</Label>
                <p className="text-sm text-muted-foreground">
                  Melding wanneer een actiepunt over de deadline is
                </p>
              </div>
              <Switch
                checked={formData.inAppActionItemOverdue}
                onCheckedChange={() => handleToggle("inAppActionItemOverdue")}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Vergadering herinnering</Label>
                <p className="text-sm text-muted-foreground">
                  Melding voor aankomende vergaderingen
                </p>
              </div>
              <Switch
                checked={formData.inAppMeetingReminder}
                onCheckedChange={() => handleToggle("inAppMeetingReminder")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Timing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timing
            </CardTitle>
            <CardDescription>
              Wanneer je herinneringen wilt ontvangen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Deadline herinnering</Label>
                <p className="text-sm text-muted-foreground">
                  Aantal dagen voor de deadline
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={7}
                  className="w-20"
                  value={formData.deadlineReminderDays}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      deadlineReminderDays: parseInt(e.target.value) || 1,
                    }))
                  }
                />
                <span className="text-sm text-muted-foreground">dagen</span>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Vergadering herinnering</Label>
                <p className="text-sm text-muted-foreground">
                  Minuten voor de vergadering
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={5}
                  max={120}
                  step={5}
                  className="w-20"
                  value={formData.meetingReminderMinutes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      meetingReminderMinutes: parseInt(e.target.value) || 30,
                    }))
                  }
                />
                <span className="text-sm text-muted-foreground">minuten</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Link href="/meldingen">
            <Button variant="outline">Annuleren</Button>
          </Link>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              "Opslaan..."
            ) : saved ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Opgeslagen!
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Opslaan
              </>
            )}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
