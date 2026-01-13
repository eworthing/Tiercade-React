import React, { useRef, useState, useCallback, useEffect } from "react";

export type MediaType = "image" | "gif" | "video";

export interface MediaUploadProps {
  value?: string | null;
  mediaType?: MediaType;
  onChange: (dataUrl: string | null, type: MediaType) => void;
  maxSizeKB?: number;
  maxVideoSizeKB?: number;
  className?: string;
  dropzoneClassName?: string;
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
  allowVideo = true,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 500,
    color: "var(--spectrum-gray-900)",
  };

  const subtleStyle: React.CSSProperties = {
    color: "var(--spectrum-gray-600)",
    fontWeight: 400,
  };

  const previewContainerStyle: React.CSSProperties = {
    position: "relative",
  };

  const previewWrapperStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    height: 128,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "var(--spectrum-gray-100)",
    border: "1px solid var(--spectrum-gray-300)",
  };

  const mediaStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  };

  const badgeStyle: React.CSSProperties = {
    position: "absolute",
    top: 8,
    left: 8,
    padding: "2px 6px",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 4,
    fontSize: 12,
    color: "white",
    display: "flex",
    alignItems: "center",
    gap: 4,
  };

  const playButtonStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    opacity: isHovered ? 1 : 0,
    transition: "opacity 0.15s ease",
    border: "none",
    cursor: "pointer",
  };

  const overlayStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    opacity: isHovered ? 1 : 0,
    transition: "opacity 0.15s ease",
    borderRadius: 8,
  };

  const overlayButtonStyle: React.CSSProperties = {
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 500,
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    transition: "background-color 0.15s ease",
  };

  const dropzoneStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 24,
    borderRadius: 8,
    border: "2px dashed",
    cursor: "pointer",
    transition: "all 0.15s ease",
    borderColor: isDragging ? "var(--spectrum-blue-700)" : "var(--spectrum-gray-400)",
    backgroundColor: isDragging ? "rgba(var(--spectrum-blue-900-rgb, 20, 115, 230), 0.1)" : "transparent",
  };

  const errorStyle: React.CSSProperties = {
    fontSize: 12,
    color: "var(--spectrum-negative-visual-color, #d31510)",
  };

  return (
    <div style={containerStyle}>
      <label style={labelStyle}>
        Media {allowVideo && <span style={subtleStyle}>(image, GIF, or video)</span>}
      </label>

      {value ? (
        // Media preview
        <div
          style={previewContainerStyle}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div style={previewWrapperStyle}>
            {isVideo ? (
              <>
                <video
                  ref={videoRef}
                  src={value}
                  style={mediaStyle}
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
                  style={playButtonStyle}
                >
                  {isVideoPlaying ? (
                    <svg style={{ width: 48, height: 48, color: "white" }} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg style={{ width: 48, height: 48, color: "white" }} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
                {/* Video badge */}
                <div style={badgeStyle}>
                  <svg style={{ width: 12, height: 12 }} fill="currentColor" viewBox="0 0 24 24">
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
                  style={mediaStyle}
                />
                {/* GIF badge */}
                {isGif && (
                  <div style={{ ...badgeStyle, fontWeight: 500 }}>
                    GIF
                  </div>
                )}
              </>
            )}
          </div>
          {/* Action overlay */}
          <div style={overlayStyle}>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              style={{
                ...overlayButtonStyle,
                backgroundColor: "var(--spectrum-gray-100)",
                color: "var(--spectrum-gray-900)",
              }}
            >
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              style={{
                ...overlayButtonStyle,
                backgroundColor: "var(--spectrum-negative-visual-color, #d31510)",
                color: "white",
              }}
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
          style={dropzoneStyle}
        >
          <svg
            style={{ width: 32, height: 32, color: "var(--spectrum-gray-600)" }}
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
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "var(--spectrum-gray-700)" }}>
              Drop file here, click to browse, or paste
            </p>
            <p style={{ fontSize: 12, color: "var(--spectrum-gray-600)", marginTop: 4 }}>
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
        style={{ display: "none" }}
      />

      {error && (
        <p style={errorStyle} role="alert">
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
