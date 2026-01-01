import React, { useRef, useState, useCallback, useEffect } from "react";

export type MediaType = "image" | "gif" | "video";

export interface MediaUploadProps {
  value?: string | null;
  mediaType?: MediaType;
  onChange: (dataUrl: string | null, type: MediaType) => void;
  maxSizeKB?: number;
  maxVideoSizeKB?: number;
  className?: string;
  allowVideo?: boolean;
}

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/avif"];
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg"];

function getMediaType(mimeType: string): MediaType {
  if (mimeType === "image/gif") return "gif";
  if (mimeType.startsWith("video/")) return "video";
  return "image";
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
  value,
  mediaType = "image",
  onChange,
  maxSizeKB = 500,
  maxVideoSizeKB = 5000, // 5MB for videos
  className = "",
  allowVideo = true,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const acceptedTypes = allowVideo
    ? [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES]
    : ACCEPTED_IMAGE_TYPES;

  const maxSizeBytes = maxSizeKB * 1024;
  const maxVideoSizeBytes = maxVideoSizeKB * 1024;

  const processFile = useCallback(
    async (file: File) => {
      setError(null);

      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");

      // Validate type
      if (!isVideo && !isImage) {
        setError("Please upload an image or video file");
        return;
      }

      if (isVideo && !allowVideo) {
        setError("Video uploads are not allowed");
        return;
      }

      // Validate specific mime types
      if (!acceptedTypes.includes(file.type)) {
        setError(`Unsupported format. Use: PNG, JPG, GIF, WebP${allowVideo ? ", MP4, WebM" : ""}`);
        return;
      }

      // Validate size
      const sizeLimit = isVideo ? maxVideoSizeBytes : maxSizeBytes;
      const sizeLimitKB = isVideo ? maxVideoSizeKB : maxSizeKB;

      if (file.size > sizeLimit) {
        setError(`File must be under ${sizeLimitKB >= 1000 ? `${sizeLimitKB / 1000}MB` : `${sizeLimitKB}KB`}`);
        return;
      }

      // For videos, validate duration
      if (isVideo) {
        try {
          const duration = await getVideoDuration(file);
          if (duration > 30) {
            setError("Video must be 30 seconds or less");
            return;
          }
        } catch {
          setError("Could not read video file");
          return;
        }
      }

      // Convert to data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const type = getMediaType(file.type);
        onChange(dataUrl, type);
      };
      reader.onerror = () => {
        setError("Failed to read file");
      };
      reader.readAsDataURL(file);
    },
    [acceptedTypes, allowVideo, maxSizeBytes, maxVideoSizeBytes, maxSizeKB, maxVideoSizeKB, onChange]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Handle paste events
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/") || (allowVideo && item.type.startsWith("video/"))) {
          const file = item.getAsFile();
          if (file) {
            processFile(file);
          }
          break;
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [processFile, allowVideo]);

  const handleRemove = () => {
    onChange(null, "image");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    setError(null);
  };

  const toggleVideoPlay = () => {
    if (!videoRef.current) return;

    if (isVideoPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsVideoPlaying(!isVideoPlaying);
  };

  const isVideo = mediaType === "video";
  const isGif = mediaType === "gif";

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-sm font-medium text-text">
        Media {allowVideo && <span className="text-text-subtle font-normal">(image, GIF, or video)</span>}
      </label>

      {value ? (
        // Media preview
        <div className="relative group">
          <div className="relative w-full h-32 rounded-lg overflow-hidden bg-surface-raised border border-border">
            {isVideo ? (
              <>
                <video
                  ref={videoRef}
                  src={value}
                  className="w-full h-full object-contain"
                  loop
                  muted
                  playsInline
                  onPlay={() => setIsVideoPlaying(true)}
                  onPause={() => setIsVideoPlaying(false)}
                />
                {/* Play/Pause overlay */}
                <button
                  type="button"
                  onClick={toggleVideoPlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {isVideoPlaying ? (
                    <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
                {/* Video badge */}
                <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 rounded text-xs text-white flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4zM5 6h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
                  </svg>
                  Video
                </div>
              </>
            ) : (
              <>
                <img
                  src={value}
                  alt="Item preview"
                  className="w-full h-full object-contain"
                />
                {/* GIF badge */}
                {isGif && (
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 rounded text-xs text-white font-medium">
                    GIF
                  </div>
                )}
              </>
            )}
          </div>
          {/* Action overlay */}
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-medium bg-surface-raised rounded-lg text-text hover:bg-surface-soft transition-colors"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-1.5 text-xs font-medium bg-danger rounded-lg text-white hover:bg-danger-soft transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        // Upload area
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`
            flex flex-col items-center justify-center gap-2 p-6
            rounded-lg border-2 border-dashed cursor-pointer
            transition-colors
            ${
              isDragging
                ? "border-accent bg-accent/10"
                : "border-border hover:border-text-subtle hover:bg-surface-raised/50"
            }
          `}
        >
          <svg
            className="w-8 h-8 text-text-subtle"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <div className="text-center">
            <p className="text-sm text-text-muted">
              Drop file here, click to browse, or paste
            </p>
            <p className="text-xs text-text-subtle mt-1">
              {allowVideo
                ? `Images: max ${maxSizeKB}KB • Videos: max ${maxVideoSizeKB >= 1000 ? `${maxVideoSizeKB / 1000}MB` : `${maxVideoSizeKB}KB`}, 30s`
                : `Max ${maxSizeKB}KB • PNG, JPG, GIF, WebP`}
            </p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={acceptedTypes.join(",")}
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

// Helper to get video duration
function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };

    video.onerror = () => {
      reject(new Error("Failed to load video metadata"));
    };

    video.src = URL.createObjectURL(file);
  });
}
