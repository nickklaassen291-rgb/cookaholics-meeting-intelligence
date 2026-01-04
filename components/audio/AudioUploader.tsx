import { useState, useCallback, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, FileAudio, Loader2, CheckCircle2 } from "lucide-react";

interface AudioUploaderProps {
  meetingId: Id<"meetings">;
  onUploadComplete?: () => void;
}

// Extended MIME types for better compatibility (including video/mp4 for phone recordings)
const ACCEPTED_TYPES = [
  "audio/mpeg", "audio/mp3",
  "audio/mp4", "audio/m4a", "audio/x-m4a", "audio/aac",
  "audio/wav", "audio/x-wav", "audio/wave",
  "video/mp4", "video/quicktime"  // Phone recordings often use video container
];
const ACCEPTED_EXTENSIONS = [".mp3", ".m4a", ".wav", ".aac", ".mp4", ".mov"];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export function AudioUploader({ meetingId, onUploadComplete }: AudioUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "processing" | "complete" | "error">("idle");

  const generateUploadUrl = useMutation(api.meetings.generateUploadUrl);
  const saveAudioFile = useMutation(api.meetings.saveAudioFile);
  const startTranscription = useMutation(api.meetings.startTranscription);

  const validateFile = (file: File): string | null => {
    // Check by extension as fallback (more reliable for m4a on macOS)
    const extension = "." + file.name.split(".").pop()?.toLowerCase();
    const hasValidExtension = ACCEPTED_EXTENSIONS.includes(extension);
    const hasValidType = ACCEPTED_TYPES.includes(file.type);

    if (!hasValidExtension && !hasValidType) {
      return `Ongeldig bestandstype (${file.type || "onbekend"}). Gebruik MP3, M4A, MP4 of WAV.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return "Bestand is te groot. Maximum is 100MB.";
    }
    return null;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const file = e.dataTransfer.files[0];
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setSelectedFile(file);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setSelectedFile(file);
    }
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploadStatus("uploading");
    setUploadProgress(0);

    try {
      // Get upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // Upload file with progress tracking
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error("Upload failed"));
          }
        };
        xhr.onerror = () => reject(new Error("Upload failed"));

        xhr.open("POST", uploadUrl);
        xhr.send(selectedFile);
      });

      // Get the storage ID from the response
      const response = JSON.parse(xhr.responseText);
      const storageId = response.storageId;

      // Save file reference to meeting
      await saveAudioFile({
        meetingId,
        storageId,
        fileName: selectedFile.name,
      });

      setUploadStatus("processing");

      // Start transcription via API route
      await startTranscription({ meetingId });

      // Call the transcription API
      const transcribeResponse = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId }),
      });

      if (!transcribeResponse.ok) {
        const errorData = await transcribeResponse.json();
        console.error("Transcription API error:", errorData);
        throw new Error(errorData.error || errorData.details || "Transcription failed");
      }

      setUploadStatus("complete");
      onUploadComplete?.();
    } catch (err) {
      console.error("Upload error:", err);
      setUploadStatus("error");
      const errorMsg = err instanceof Error ? err.message : "Onbekende fout";
      setError(`Fout: ${errorMsg}`);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setUploadStatus("idle");
    setUploadProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Show upload complete state
  if (uploadStatus === "complete") {
    return (
      <div className="flex items-center gap-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
        <CheckCircle2 className="h-8 w-8 text-green-500" />
        <div className="flex-1">
          <p className="font-medium text-green-700 dark:text-green-400">Upload voltooid</p>
          <p className="text-sm text-muted-foreground">
            Transcriptie wordt verwerkt...
          </p>
        </div>
      </div>
    );
  }

  // Show uploading/processing state
  if (uploadStatus === "uploading" || uploadStatus === "processing") {
    return (
      <div className="space-y-4 p-4 rounded-lg border">
        <div className="flex items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="flex-1">
            <p className="font-medium">
              {uploadStatus === "uploading" ? "Bezig met uploaden..." : "Verwerken..."}
            </p>
            <p className="text-sm text-muted-foreground">
              {selectedFile?.name}
            </p>
          </div>
        </div>
        <Progress value={uploadStatus === "processing" ? 100 : uploadProgress} />
        <p className="text-xs text-muted-foreground text-center">
          {uploadStatus === "uploading"
            ? `${uploadProgress}% geüpload`
            : "Bestand wordt voorbereid voor transcriptie..."}
        </p>
      </div>
    );
  }

  // Show selected file
  if (selectedFile) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 rounded-lg border">
          <FileAudio className="h-10 w-10 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{selectedFile.name}</p>
            <p className="text-sm text-muted-foreground">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCancel} className="flex-1">
            Annuleren
          </Button>
          <Button onClick={handleUpload} className="flex-1">
            <Upload className="mr-2 h-4 w-4" />
            Uploaden & Transcriberen
          </Button>
        </div>
      </div>
    );
  }

  // Show drop zone
  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.m4a,.wav,.aac,.mp4,.mov"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-medium mb-1">Upload audio bestand</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Sleep een bestand hierheen of klik om te uploaden
        </p>
        <Button variant="outline" type="button">
          <Upload className="mr-2 h-4 w-4" />
          Bestand selecteren
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          MP3, M4A, MP4 of WAV (max. 100MB)
        </p>
      </div>
    </div>
  );
}
