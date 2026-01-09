import { useState, useCallback, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Maximum file size: 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

// Allowed audio formats
const ALLOWED_FORMATS = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/ogg",
  "audio/webm",
  "audio/flac",
];

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UseAudioUploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (storageId: Id<"_storage">) => void;
  onError?: (error: Error) => void;
}

interface UseAudioUploadResult {
  uploadAudio: (file: File, meetingId: Id<"meetings">) => Promise<void>;
  isUploading: boolean;
  progress: UploadProgress | null;
  error: string | null;
  reset: () => void;
  validateFile: (file: File) => { valid: boolean; error?: string };
}

export function useAudioUpload(
  options: UseAudioUploadOptions = {}
): UseAudioUploadResult {
  const { onProgress, onSuccess, onError } = options;

  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generateUploadUrl = useMutation(api.meetings.generateUploadUrl);
  const saveAudioFile = useMutation(api.meetings.saveAudioFile);

  // Validate file before upload
  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!ALLOWED_FORMATS.includes(file.type)) {
      return {
        valid: false,
        error: `Ongeldig bestandstype. Toegestane formaten: MP3, WAV, M4A, OGG, WebM, FLAC`,
      };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = Math.round(file.size / (1024 * 1024));
      return {
        valid: false,
        error: `Bestand is te groot (${sizeMB}MB). Maximale grootte is 100MB.`,
      };
    }

    // Check if file is empty
    if (file.size === 0) {
      return {
        valid: false,
        error: "Bestand is leeg.",
      };
    }

    return { valid: true };
  }, []);

  // Upload audio file with progress tracking
  const uploadAudio = useCallback(
    async (file: File, meetingId: Id<"meetings">) => {
      // Validate file first
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error || "Ongeldig bestand");
        onError?.(new Error(validation.error));
        return;
      }

      setIsUploading(true);
      setError(null);
      setProgress({ loaded: 0, total: file.size, percentage: 0 });

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      try {
        // Step 1: Get upload URL from Convex
        const uploadUrl = await generateUploadUrl();

        // Step 2: Upload file with XMLHttpRequest for progress tracking
        const storageId = await new Promise<Id<"_storage">>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          // Progress handler
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const progressData = {
                loaded: event.loaded,
                total: event.total,
                percentage: Math.round((event.loaded / event.total) * 100),
              };
              setProgress(progressData);
              onProgress?.(progressData);
            }
          };

          // Success handler
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response.storageId);
              } catch {
                reject(new Error("Kon server response niet verwerken"));
              }
            } else {
              reject(new Error(`Upload mislukt: ${xhr.statusText}`));
            }
          };

          // Error handler
          xhr.onerror = () => {
            reject(new Error("Netwerkfout tijdens uploaden"));
          };

          // Abort handler
          xhr.onabort = () => {
            reject(new Error("Upload geannuleerd"));
          };

          // Timeout handler (5 minutes for large files)
          xhr.timeout = 5 * 60 * 1000;
          xhr.ontimeout = () => {
            reject(new Error("Upload duurde te lang"));
          };

          // Send request
          xhr.open("POST", uploadUrl);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.send(file);

          // Handle abort from our controller
          abortControllerRef.current?.signal.addEventListener("abort", () => {
            xhr.abort();
          });
        });

        // Step 3: Save file reference to meeting
        await saveAudioFile({
          meetingId,
          storageId,
          fileName: file.name,
        });

        // Success
        setProgress({ loaded: file.size, total: file.size, percentage: 100 });
        onSuccess?.(storageId);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Upload mislukt";
        setError(errorMessage);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
      } finally {
        setIsUploading(false);
        abortControllerRef.current = null;
      }
    },
    [generateUploadUrl, saveAudioFile, validateFile, onProgress, onSuccess, onError]
  );

  // Reset state
  const reset = useCallback(() => {
    // Abort any in-progress upload
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsUploading(false);
    setProgress(null);
    setError(null);
  }, []);

  return {
    uploadAudio,
    isUploading,
    progress,
    error,
    reset,
    validateFile,
  };
}

// Helper function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
}

// Helper function to estimate upload time
export function estimateUploadTime(
  fileSize: number,
  uploadSpeed: number = 1024 * 1024 // 1 MB/s default
): string {
  const seconds = Math.ceil(fileSize / uploadSpeed);

  if (seconds < 60) {
    return `${seconds} seconden`;
  } else if (seconds < 3600) {
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} ${minutes === 1 ? "minuut" : "minuten"}`;
  } else {
    const hours = Math.ceil(seconds / 3600);
    return `${hours} ${hours === 1 ? "uur" : "uur"}`;
  }
}

// Audio compression helper (optional, for client-side optimization)
export async function compressAudio(
  file: File,
  targetBitrate: number = 128000
): Promise<Blob> {
  // Check if MediaRecorder is available
  if (typeof MediaRecorder === "undefined") {
    throw new Error("Audio compressie niet ondersteund in deze browser");
  }

  // Create audio context
  const audioContext = new AudioContext();
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // Create offline context for processing
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );

  // Create source
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineContext.destination);
  source.start();

  // Render
  const renderedBuffer = await offlineContext.startRendering();

  // Encode to compressed format
  // Note: This is a simplified version. For production, consider using
  // a library like lamejs for MP3 encoding or opus-recorder for Opus.
  const wavBlob = audioBufferToWav(renderedBuffer);

  return wavBlob;
}

// Convert AudioBuffer to WAV Blob
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const dataLength = buffer.length * blockAlign;
  const bufferLength = 44 + dataLength;

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // WAV header
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  // Write audio data
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = buffer.getChannelData(channel)[i];
      const value = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, value < 0 ? value * 0x8000 : value * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
