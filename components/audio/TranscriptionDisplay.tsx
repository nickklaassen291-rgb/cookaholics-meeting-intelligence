import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Copy,
  Check,
  RefreshCw,
  Loader2,
  FileText,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TranscriptionDisplayProps {
  meetingId: Id<"meetings">;
  transcription?: string;
  status?: "pending" | "processing" | "completed" | "failed";
  hasAudio: boolean;
  className?: string;
}

export function TranscriptionDisplay({
  meetingId,
  transcription,
  status,
  hasAudio,
  className,
}: TranscriptionDisplayProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const retryTranscription = useMutation(api.meetings.retryTranscription);

  const handleCopy = async () => {
    if (!transcription) return;

    try {
      await navigator.clipboard.writeText(transcription);
      setCopied(true);
      toast({
        title: "Gekopieerd",
        description: "Transcriptie is naar het klembord gekopieerd",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Fout",
        description: "Kon transcriptie niet kopiëren",
        variant: "destructive",
      });
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await retryTranscription({ meetingId });

      // Call the transcription API again
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId }),
      });

      if (!response.ok) {
        throw new Error("Transcription retry failed");
      }

      toast({
        title: "Transcriptie opnieuw gestart",
        description: "De audio wordt opnieuw getranscribeerd",
      });
    } catch {
      toast({
        title: "Fout",
        description: "Kon transcriptie niet opnieuw starten",
        variant: "destructive",
      });
    } finally {
      setIsRetrying(false);
    }
  };

  // No audio uploaded yet
  if (!hasAudio) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        <FileText className="h-10 w-10 mx-auto mb-4 opacity-50" />
        <p>Nog geen transcriptie beschikbaar</p>
        <p className="text-sm">Upload eerst een audio bestand</p>
      </div>
    );
  }

  // Pending status
  if (status === "pending") {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        <FileText className="h-10 w-10 mx-auto mb-4 opacity-50" />
        <p>Wacht op transcriptie</p>
        <p className="text-sm">Audio is geüpload, transcriptie wordt gestart...</p>
      </div>
    );
  }

  // Processing status
  if (status === "processing") {
    return (
      <div className={cn("text-center py-8", className)}>
        <Loader2 className="h-10 w-10 mx-auto mb-4 animate-spin text-primary" />
        <p className="font-medium">Transcriptie wordt verwerkt...</p>
        <p className="text-sm text-muted-foreground mt-1">
          Dit kan enkele minuten duren, afhankelijk van de lengte van de opname
        </p>
      </div>
    );
  }

  // Failed status
  if (status === "failed") {
    return (
      <div className={cn("text-center py-8", className)}>
        <AlertCircle className="h-10 w-10 mx-auto mb-4 text-destructive" />
        <p className="font-medium text-destructive">Transcriptie mislukt</p>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Er is iets misgegaan bij het transcriberen van de audio
        </p>
        <Button
          variant="outline"
          onClick={handleRetry}
          disabled={isRetrying}
        >
          {isRetrying ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Opnieuw proberen
        </Button>
      </div>
    );
  }

  // Completed with transcription
  if (transcription) {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            {copied ? "Gekopieerd!" : "Kopiëren"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Opnieuw
          </Button>
        </div>

        {/* Transcription text */}
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <p className="whitespace-pre-wrap leading-relaxed">{transcription}</p>
        </div>
      </div>
    );
  }

  // Fallback - no transcription available
  return (
    <div className={cn("text-center py-8 text-muted-foreground", className)}>
      <FileText className="h-10 w-10 mx-auto mb-4 opacity-50" />
      <p>Geen transcriptie beschikbaar</p>
    </div>
  );
}
