import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Button,
  ButtonGroup,
  Content,
  DropZone,
  FileTrigger,
  Heading,
  IllustratedMessage,
  InlineAlert,
  Image,
  Text,
} from "@react-spectrum/s2";
import DropToUpload from "@react-spectrum/s2/illustrations/linear/DropToUpload";
import { style } from "@react-spectrum/s2/style" with { type: "macro" };

import {
  MAX_AUDIO_SIZE_KB,
  MAX_IMAGE_SIZE_KB,
  MAX_VIDEO_SIZE_KB,
  SUPPORTED_AUDIO_TYPES,
  SUPPORTED_IMAGE_TYPES,
  SUPPORTED_VIDEO_TYPES,
} from "@tiercade/core";

export type MediaType = "image" | "gif" | "video" | "audio";

export interface MediaUploadProps {
  value?: string | null;
  mediaType?: MediaType;
  onChange: (dataUrl: string | null, type: MediaType) => void;
  maxSizeKB?: number;
  maxVideoSizeKB?: number;
  maxAudioSizeKB?: number;
  className?: string;
  dropzoneClassName?: string;
  allowVideo?: boolean;
  allowAudio?: boolean;
}

const ACCEPTED_IMAGE_TYPES: string[] = [...SUPPORTED_IMAGE_TYPES];
const ACCEPTED_VIDEO_TYPES: string[] = [...SUPPORTED_VIDEO_TYPES];
const ACCEPTED_AUDIO_TYPES: string[] = [...SUPPORTED_AUDIO_TYPES];

function getMediaType(mimeType: string): MediaType {
  if (mimeType === "image/gif") return "gif";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "image";
}

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

const previewFrame = style({
  width: "full",
  height: 160,
  borderRadius: "lg",
  overflow: "hidden",
  backgroundColor: "gray-100",
  borderStyle: "solid",
  borderWidth: 1,
  borderColor: "gray-300",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

export const MediaUpload: React.FC<MediaUploadProps> = ({
  value,
  mediaType = "image",
  onChange,
  maxSizeKB = MAX_IMAGE_SIZE_KB,
  maxVideoSizeKB = MAX_VIDEO_SIZE_KB,
  maxAudioSizeKB = MAX_AUDIO_SIZE_KB,
  allowVideo = true,
  allowAudio = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  const acceptedTypes = useMemo(
    () => {
      const types = [...ACCEPTED_IMAGE_TYPES];
      if (allowVideo) types.push(...ACCEPTED_VIDEO_TYPES);
      if (allowAudio) types.push(...ACCEPTED_AUDIO_TYPES);
      return types;
    },
    [allowAudio, allowVideo]
  );

  const maxSizeBytes = maxSizeKB * 1024;
  const maxVideoSizeBytes = maxVideoSizeKB * 1024;
  const maxAudioSizeBytes = maxAudioSizeKB * 1024;

  const processFile = useCallback(
    async (file: File) => {
      setError(null);

      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      const isAudio = file.type.startsWith("audio/");

      if (!isVideo && !isImage && !isAudio) {
        setError("Please upload an image, video, or audio file");
        return;
      }

      if (isVideo && !allowVideo) {
        setError("Video uploads are not allowed");
        return;
      }

      if (isAudio && !allowAudio) {
        setError("Audio uploads are not allowed");
        return;
      }

      if (!acceptedTypes.includes(file.type)) {
        setError("Unsupported format.");
        return;
      }

      const sizeLimit = isVideo ? maxVideoSizeBytes : isAudio ? maxAudioSizeBytes : maxSizeBytes;
      const sizeLimitKB = isVideo ? maxVideoSizeKB : isAudio ? maxAudioSizeKB : maxSizeKB;
      if (file.size > sizeLimit) {
        setError(
          `File must be under ${
            sizeLimitKB >= 1000 ? `${sizeLimitKB / 1000}MB` : `${sizeLimitKB}KB`
          }`
        );
        return;
      }

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

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        onChange(dataUrl, getMediaType(file.type));
      };
      reader.onerror = () => setError("Failed to read file");
      reader.readAsDataURL(file);
    },
    [
      acceptedTypes,
      allowAudio,
      allowVideo,
      maxAudioSizeBytes,
      maxSizeBytes,
      maxVideoSizeBytes,
      maxAudioSizeKB,
      maxSizeKB,
      maxVideoSizeKB,
      onChange,
    ]
  );

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (
          item.type.startsWith("image/") ||
          (allowVideo && item.type.startsWith("video/")) ||
          (allowAudio && item.type.startsWith("audio/"))
        ) {
          const file = item.getAsFile();
          if (file) void processFile(file);
          break;
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [processFile, allowAudio, allowVideo]);

  const handleRemove = () => {
    onChange(null, "image");
    setError(null);
  };

  const isVideo = mediaType === "video";
  const isGif = mediaType === "gif";
  const isAudio = mediaType === "audio";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Text>
        {allowVideo && allowAudio
          ? "Media (image, GIF, video, or audio)"
          : allowVideo
            ? "Media (image, GIF, or video)"
            : allowAudio
              ? "Media (image, GIF, or audio)"
              : "Media (image or GIF)"}
      </Text>

      {value ? (
        <>
          <div className={previewFrame}>
            {isVideo ? (
              <video
                ref={videoRef}
                src={value}
                controls
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : isAudio ? (
              <audio controls src={value} style={{ width: "100%" }} />
            ) : (
              <Image src={value} alt={isGif ? "GIF preview" : "Image preview"} />
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <Badge variant="neutral" fillStyle="subtle">
              {isVideo ? "Video" : isAudio ? "Audio" : isGif ? "GIF" : "Image"}
            </Badge>

            <ButtonGroup>
              <FileTrigger
                acceptedFileTypes={acceptedTypes}
                onSelect={(files) => {
                  const file = files?.[0];
                  if (file) void processFile(file);
                }}
              >
                <Button variant="secondary">Replace</Button>
              </FileTrigger>
              <Button variant="negative" onPress={handleRemove}>
                Remove
              </Button>
            </ButtonGroup>
          </div>
        </>
      ) : (
        <DropZone
          aria-label="Upload media"
          onDrop={async (e) => {
            const files = await Promise.all(
              e.items
                .filter((item) => item.kind === "file")
                .map((item) => item.getFile())
            );
            const file = files[0];
            if (file) void processFile(file);
          }}
        >
          <IllustratedMessage>
            <DropToUpload />
            <Heading>Drop media here</Heading>
            <Content>
              <Text>
                {allowVideo || allowAudio
                  ? `Images: max ${maxSizeKB}KB${
                      allowVideo
                        ? ` • Videos: max ${
                            maxVideoSizeKB >= 1000 ? `${maxVideoSizeKB / 1000}MB` : `${maxVideoSizeKB}KB`
                          }, 30s`
                        : ""
                    }${
                      allowAudio
                        ? ` • Audio: max ${
                            maxAudioSizeKB >= 1000 ? `${maxAudioSizeKB / 1000}MB` : `${maxAudioSizeKB}KB`
                          }`
                        : ""
                    } • Paste supported`
                  : `Max ${maxSizeKB}KB • Paste supported`}
              </Text>
            </Content>
            <FileTrigger
              acceptedFileTypes={acceptedTypes}
              onSelect={(files) => {
                const file = files?.[0];
                if (file) void processFile(file);
              }}
            >
              <Button variant="secondary">Browse…</Button>
            </FileTrigger>
          </IllustratedMessage>
        </DropZone>
      )}

      {error && <InlineAlert variant="negative">{error}</InlineAlert>}
    </div>
  );
};

MediaUpload.displayName = "MediaUpload";
