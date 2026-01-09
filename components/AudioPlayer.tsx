import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  src: string | null;
  className?: string;
  onTimeUpdate?: (currentTime: number) => void;
  onEnded?: () => void;
  initialTime?: number;
}

export function AudioPlayer({
  src,
  className,
  onTimeUpdate,
  onEnded,
  initialTime = 0,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buffered, setBuffered] = useState(0);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle play/pause
  const togglePlay = useCallback(async () => {
    if (!audioRef.current || !src) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        setIsLoading(true);
        await audioRef.current.play();
      }
    } catch (err) {
      console.error("Playback error:", err);
      setError("Kon audio niet afspelen");
    }
  }, [isPlaying, src]);

  // Handle seeking
  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressRef.current || !duration) return;

    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  // Skip forward/backward
  const skip = useCallback((seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(
      0,
      Math.min(duration, audioRef.current.currentTime + seconds)
    );
  }, [duration]);

  // Handle volume change
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioRef.current.muted = newMuted;
  }, [isMuted]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      if (initialTime > 0) {
        audio.currentTime = initialTime;
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      onTimeUpdate?.(audio.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    const handleError = () => {
      setError("Fout bij laden van audio");
      setIsLoading(false);
      setIsPlaying(false);
    };

    const handleProgress = () => {
      if (audio.buffered.length > 0) {
        const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
        setBuffered((bufferedEnd / audio.duration) * 100);
      }
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("progress", handleProgress);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("progress", handleProgress);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, [initialTime, onTimeUpdate, onEnded]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          skip(-10);
          break;
        case "ArrowRight":
          skip(10);
          break;
        case "m":
          toggleMute();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, skip, toggleMute]);

  if (!src) {
    return (
      <div className={cn("bg-gray-100 rounded-lg p-4 text-center text-gray-500", className)}>
        Geen audio beschikbaar
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("bg-red-50 rounded-lg p-4 text-center text-red-600", className)}>
        {error}
      </div>
    );
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn("bg-gray-100 rounded-lg p-4", className)}>
      {/* Hidden audio element */}
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Controls */}
      <div className="flex items-center gap-4">
        {/* Skip back */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => skip(-10)}
          disabled={!duration}
          className="text-gray-600"
          aria-label="10 seconden terug"
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        {/* Play/Pause */}
        <Button
          variant="default"
          size="sm"
          onClick={togglePlay}
          disabled={isLoading}
          className="w-10 h-10 rounded-full"
          aria-label={isPlaying ? "Pauzeren" : "Afspelen"}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>

        {/* Skip forward */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => skip(10)}
          disabled={!duration}
          className="text-gray-600"
          aria-label="10 seconden vooruit"
        >
          <SkipForward className="h-4 w-4" />
        </Button>

        {/* Time display */}
        <span className="text-sm text-gray-600 tabular-nums min-w-[45px]">
          {formatTime(currentTime)}
        </span>

        {/* Progress bar */}
        <div
          ref={progressRef}
          className="flex-1 h-2 bg-gray-300 rounded-full cursor-pointer relative overflow-hidden"
          onClick={handleSeek}
          role="slider"
          aria-label="Voortgang"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
        >
          {/* Buffered */}
          <div
            className="absolute h-full bg-gray-400 rounded-full"
            style={{ width: `${buffered}%` }}
          />
          {/* Progress */}
          <div
            className="absolute h-full bg-blue-600 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Duration */}
        <span className="text-sm text-gray-600 tabular-nums min-w-[45px]">
          {formatTime(duration)}
        </span>

        {/* Volume */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            className="text-gray-600"
            aria-label={isMuted ? "Geluid aan" : "Geluid uit"}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-20 h-1 accent-blue-600"
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  );
}

// Seek to specific timestamp (for linking from transcription)
export function useAudioSeek(audioPlayerRef: React.RefObject<HTMLAudioElement>) {
  return useCallback((timestamp: number) => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.currentTime = timestamp;
      audioPlayerRef.current.play();
    }
  }, [audioPlayerRef]);
}
