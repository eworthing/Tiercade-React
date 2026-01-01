/**
 * Media-related constants
 *
 * File size limits and supported types for media uploads
 */

/** Maximum image file size in KB */
export const MAX_IMAGE_SIZE_KB = 500;

/** Maximum video file size in KB */
export const MAX_VIDEO_SIZE_KB = 5000;

/** Maximum audio file size in KB */
export const MAX_AUDIO_SIZE_KB = 3000;

/** Maximum video duration in seconds */
export const MAX_VIDEO_DURATION_SECONDS = 30;

/** Supported image MIME types */
export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

/** Supported video MIME types */
export const SUPPORTED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

/** Supported audio MIME types */
export const SUPPORTED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
] as const;

/** All supported media types */
export const SUPPORTED_MEDIA_TYPES = [
  ...SUPPORTED_IMAGE_TYPES,
  ...SUPPORTED_VIDEO_TYPES,
  ...SUPPORTED_AUDIO_TYPES,
] as const;

/** File extension to media type mapping */
export const EXTENSION_TO_MEDIA_TYPE: Record<string, "image" | "video" | "audio" | "gif"> = {
  jpg: "image",
  jpeg: "image",
  png: "image",
  webp: "image",
  gif: "gif",
  mp4: "video",
  webm: "video",
  mov: "video",
  mp3: "audio",
  wav: "audio",
  ogg: "audio",
};
