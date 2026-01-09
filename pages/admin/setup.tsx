import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Building2,
  CalendarDays,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

type SeedResult = { message: string; count: number } | null;

export default function AdminSetupPage() {
  const [isSeeding, setIsSeeding] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, SeedResult>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check current data
  const departments = useQuery(api.departments.list);
  const meetingTypes = useQuery(api.meetingTypes.list);
  const meetingScripts = useQuery(api.meetingScripts.list);

  // Seed mutations
  const seedDepartments = useMutation(api.departments.seed);
  const seedMeetingTypes = useMutation(api.meetingTypes.seed);
  const seedMeetingScripts = useMutation(api.meetingScripts.seed);

  const handleSeed = async (type: string) => {
    setIsSeeding(type);
    setErrors((prev) => ({ ...prev, [type]: "" }));

    try {
      let result: SeedResult = null;

      switch (type) {
        case "departments":
          result = await seedDepartments({});
          break;
        case "meetingTypes":
          result = await seedMeetingTypes({});
          break;
        case "meetingScripts":
          result = await seedMeetingScripts({});
          break;
      }

      setResults((prev) => ({ ...prev, [type]: result }));
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [type]: err instanceof Error ? err.message : "Onbekende fout",
      }));
    } finally {
      setIsSeeding(null);
    }
  };

  const handleSeedAll = async () => {
    await handleSeed("departments");
    await handleSeed("meetingTypes");
    await handleSeed("meetingScripts");
  };

  const seedItems = [
    {
      id: "departments",
      title: "Afdelingen",
      description: "Keuken, Sales, Marketing, MT",
      icon: Building2,
      count: departments?.length,
      expected: 4,
    },
    {
      id: "meetingTypes",
      title: "Vergadertypes",
      description: "Daily, Weekly, Monthly, etc.",
      icon: CalendarDays,
      count: meetingTypes?.length,
      expected: 7,
    },
    {
      id: "meetingScripts",
      title: "Vergaderscripts",
      description: "Templates voor gestructureerde vergaderingen",
      icon: FileText,
      count: meetingScripts?.length,
      expected: 7,
    },
  ];

  const allSeeded = seedItems.every((item) => item.count && item.count >= item.expected);

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Database className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Database Setup</h1>
          <p className="text-muted-foreground mt-2">
            Initialiseer de database met standaard gegevens
          </p>
        </div>

        {/* Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Status</span>
              {allSeeded ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Volledig geconfigureerd
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Setup vereist
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {seedItems.map((item) => {
                const Icon = item.icon;
                const isComplete = item.count && item.count >= item.expected;
                const isLoading = isSeeding === item.id;
                const result = results[item.id];
                const error = errors[item.id];

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isComplete ? "bg-green-100" : "bg-muted"
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${
                            isComplete ? "text-green-600" : "text-muted-foreground"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        {error && <p className="text-sm text-destructive mt-1">{error}</p>}
                        {result && (
                          <p className="text-sm text-green-600 mt-1">{result.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant={isComplete ? "default" : "secondary"}>
                        {item.count ?? "..."} / {item.expected}
                      </Badge>
                      <Button
                        size="sm"
                        variant={isComplete ? "outline" : "default"}
                        onClick={() => handleSeed(item.id)}
                        disabled={isSeeding !== null}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isComplete ? (
                          <RefreshCw className="w-4 h-4" />
                        ) : (
                          "Seed"
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Seed All Button */}
        {!allSeeded && (
          <Card>
            <CardContent className="pt-6">
              <Button
                className="w-full"
                size="lg"
                onClick={handleSeedAll}
                disabled={isSeeding !== null}
              >
                {isSeeding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Bezig met seeden...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Seed alle data
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        {allSeeded && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-5 h-5" />
                Setup Compleet
              </CardTitle>
              <CardDescription className="text-green-600">
                De database is volledig geconfigureerd. Volgende stappen:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-green-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Nodig teamleden uit via Clerk
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Wijs afdelingen toe aan gebruikers
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Begin met het plannen van vergaderingen
                </li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
