import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Plus,
  Loader2,
  ChevronRight,
  Star,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function ScriptsPage() {
  const [isSeeding, setIsSeeding] = useState(false);

  const meetingTypes = useQuery(api.meetingTypes.list, {});
  const scripts = useQuery(api.meetingScripts.list, {});
  const seedScripts = useMutation(api.meetingScripts.seed);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await seedScripts({});
    } finally {
      setIsSeeding(false);
    }
  };

  const getScriptsForType = (meetingTypeId: Id<"meetingTypes">) => {
    return scripts?.filter((s) => s.meetingTypeId === meetingTypeId) || [];
  };

  if (meetingTypes === undefined || scripts === undefined) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Vergaderscripts</h1>
            <p className="text-muted-foreground">
              Beheer scripts en templates voor gestructureerde vergaderingen
            </p>
          </div>
          {scripts.length === 0 && (
            <Button onClick={handleSeed} disabled={isSeeding}>
              {isSeeding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Genereren...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Genereer standaard scripts
                </>
              )}
            </Button>
          )}
        </div>

        {/* Scripts per Meeting Type */}
        {scripts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Geen scripts</h3>
              <p className="text-muted-foreground text-center mb-4">
                Er zijn nog geen vergaderscripts aangemaakt.
              </p>
              <Button onClick={handleSeed} disabled={isSeeding}>
                <Sparkles className="mr-2 h-4 w-4" />
                Genereer standaard scripts
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {meetingTypes.map((meetingType) => {
              const typeScripts = getScriptsForType(meetingType._id);

              return (
                <Card key={meetingType._id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{meetingType.name}</CardTitle>
                        <CardDescription>{meetingType.description}</CardDescription>
                      </div>
                      <Badge variant="outline">
                        {typeScripts.length} script{typeScripts.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {typeScripts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Geen scripts voor dit vergadertype
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {typeScripts.map((script) => (
                          <Link
                            key={script._id}
                            href={`/admin/scripts/${script._id}`}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{script.name}</span>
                              {script.isDefault && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <Star className="h-3 w-3" />
                                  Standaard
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span className="text-sm">{script.sections.length} secties</span>
                              <ChevronRight className="h-4 w-4" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
