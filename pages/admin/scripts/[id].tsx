import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Loader2,
  Save,
  Star,
  Trash2,
  Plus,
  GripVertical,
  Printer,
  Eye,
} from "lucide-react";
import Link from "next/link";

interface Section {
  title: string;
  description: string;
  samplePhrases?: string[];
  order: number;
}

export default function ScriptDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [name, setName] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [isDefault, setIsDefault] = useState(false);

  const script = useQuery(
    api.meetingScripts.getById,
    id ? { id: id as Id<"meetingScripts"> } : "skip"
  );

  const meetingType = useQuery(
    api.meetingTypes.list,
    {}
  );

  const updateScript = useMutation(api.meetingScripts.update);
  const removeScript = useMutation(api.meetingScripts.remove);

  // Initialize form when script loads
  useEffect(() => {
    if (script) {
      setName(script.name);
      setSections(script.sections);
      setIsDefault(script.isDefault);
    }
  }, [script]);

  const handleSave = async () => {
    if (!script) return;

    setIsSaving(true);
    try {
      await updateScript({
        id: script._id,
        name,
        sections,
        isDefault,
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!script) return;

    setIsDeleting(true);
    try {
      await removeScript({ id: script._id });
      router.push("/admin/scripts");
    } catch (err) {
      console.error("Delete error:", err);
      setIsDeleting(false);
    }
  };

  const handleAddSection = () => {
    setSections([
      ...sections,
      {
        title: "Nieuwe sectie",
        description: "",
        samplePhrases: [],
        order: sections.length + 1,
      },
    ]);
  };

  const handleRemoveSection = (index: number) => {
    const newSections = sections.filter((_, i) => i !== index);
    // Reorder
    setSections(newSections.map((s, i) => ({ ...s, order: i + 1 })));
  };

  const handleUpdateSection = (index: number, updates: Partial<Section>) => {
    setSections(sections.map((s, i) => (i === index ? { ...s, ...updates } : s)));
  };

  const handlePrint = () => {
    window.print();
  };

  const currentMeetingType = meetingType?.find((mt) => mt._id === script?.meetingTypeId);

  if (!script) {
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
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/scripts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              {isEditing ? (
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-2xl font-bold h-auto py-1 px-2 max-w-md"
                />
              ) : (
                <h1 className="text-3xl font-bold">{script.name}</h1>
              )}
              {script.isDefault && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Standaard
                </Badge>
              )}
            </div>
            {currentMeetingType && (
              <p className="text-muted-foreground mt-1">
                Vergadertype: {currentMeetingType.name}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPreview(true)}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Annuleren
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Opslaan
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Bewerken
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Default Checkbox when editing */}
        {isEditing && (
          <Card>
            <CardContent className="pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="h-4 w-4"
                />
                <span>Dit is het standaard script voor dit vergadertype</span>
              </label>
            </CardContent>
          </Card>
        )}

        {/* Sections */}
        <div className="space-y-4" id="printable-script">
          {sections.map((section, index) => (
            <Card key={index} className="print:break-inside-avoid">
              <CardHeader className="pb-2">
                <div className="flex items-start gap-4">
                  {isEditing && (
                    <div className="pt-2 cursor-move text-muted-foreground">
                      <GripVertical className="h-5 w-5" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{section.order}</Badge>
                      {isEditing ? (
                        <Input
                          value={section.title}
                          onChange={(e) =>
                            handleUpdateSection(index, { title: e.target.value })
                          }
                          className="font-semibold"
                        />
                      ) : (
                        <CardTitle>{section.title}</CardTitle>
                      )}
                    </div>
                    {isEditing ? (
                      <Textarea
                        value={section.description}
                        onChange={(e) =>
                          handleUpdateSection(index, { description: e.target.value })
                        }
                        className="mt-2"
                        rows={2}
                      />
                    ) : (
                      <CardDescription className="mt-1">
                        {section.description}
                      </CardDescription>
                    )}
                  </div>
                  {isEditing && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSection(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    Voorbeeldzinnen voor de voorzitter:
                  </Label>
                  {isEditing ? (
                    <div className="space-y-2">
                      {(section.samplePhrases || []).map((phrase, phraseIndex) => (
                        <div key={phraseIndex} className="flex gap-2">
                          <Input
                            value={phrase}
                            onChange={(e) => {
                              const newPhrases = [...(section.samplePhrases || [])];
                              newPhrases[phraseIndex] = e.target.value;
                              handleUpdateSection(index, { samplePhrases: newPhrases });
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newPhrases = (section.samplePhrases || []).filter(
                                (_, i) => i !== phraseIndex
                              );
                              handleUpdateSection(index, { samplePhrases: newPhrases });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleUpdateSection(index, {
                            samplePhrases: [...(section.samplePhrases || []), ""],
                          });
                        }}
                      >
                        <Plus className="mr-2 h-3 w-3" />
                        Zin toevoegen
                      </Button>
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {(section.samplePhrases || []).map((phrase, phraseIndex) => (
                        <li
                          key={phraseIndex}
                          className="text-sm pl-4 border-l-2 border-primary/20 py-1"
                        >
                          &ldquo;{phrase}&rdquo;
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {isEditing && (
            <Button variant="outline" onClick={handleAddSection} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Sectie toevoegen
            </Button>
          )}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Script Preview</DialogTitle>
            <DialogDescription>
              Zo ziet het script eruit voor de voorzitter
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="text-center border-b pb-4">
              <h2 className="text-xl font-bold">{script.name}</h2>
              {currentMeetingType && (
                <p className="text-muted-foreground">{currentMeetingType.name}</p>
              )}
            </div>

            {sections.map((section, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {section.order}
                  </div>
                  <h3 className="font-semibold">{section.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground pl-8">{section.description}</p>
                {section.samplePhrases && section.samplePhrases.length > 0 && (
                  <div className="pl-8 space-y-1">
                    {section.samplePhrases.map((phrase, i) => (
                      <p key={i} className="text-sm italic text-muted-foreground">
                        &ldquo;{phrase}&rdquo;
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Sluiten
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Afdrukken
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Script verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je dit script wilt verwijderen? Dit kan niet ongedaan
              worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verwijderen...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Verwijderen
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-script,
          #printable-script * {
            visibility: visible;
          }
          #printable-script {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
        }
      `}</style>
    </Layout>
  );
}
