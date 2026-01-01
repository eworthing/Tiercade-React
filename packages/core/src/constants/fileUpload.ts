/**
 * File upload constants - single source of truth for all file handling
 */

// Accepted MIME types
export const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/avif",
] as const;

export const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
] as const;

export const ACCEPTED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/mp3",
  "audio/webm",
] as const;

// File size limits in bytes
export const FILE_SIZE_LIMITS = {
  /** Maximum image file size: 500KB */
  IMAGE: 500 * 1024,
  /** Maximum video file size: 5MB */
  VIDEO: 5 * 1024 * 1024,
  /** Maximum audio file size: 5MB */
  AUDIO: 5 * 1024 * 1024,
} as const;

// File size limits in KB (for component props)
export const FILE_SIZE_LIMITS_KB = {
  IMAGE: 500,
  VIDEO: 5000,
  AUDIO: 5000,
} as const;

/** Maximum video duration in seconds */
export const MAX_VIDEO_DURATION_SECONDS = 30;

// Type guards
export function isAcceptedImageType(mimeType: string): boolean {
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(mimeType);
}

export function isAcceptedVideoType(mimeType: string): boolean {
  return (ACCEPTED_VIDEO_TYPES as readonly string[]).includes(mimeType);
}

export function isAcceptedAudioType(mimeType: string): boolean {
  return (ACCEPTED_AUDIO_TYPES as readonly string[]).includes(mimeType);
}

export function isAcceptedFileType(mimeType: string): boolean {
  return (
    isAcceptedImageType(mimeType) ||
    isAcceptedVideoType(mimeType) ||
    isAcceptedAudioType(mimeType)
  );
}

export function getMaxFileSize(mimeType: string): number {
  if (isAcceptedVideoType(mimeType)) return FILE_SIZE_LIMITS.VIDEO;
  if (isAcceptedAudioType(mimeType)) return FILE_SIZE_LIMITS.AUDIO;
  return FILE_SIZE_LIMITS.IMAGE;
}

export function isValidFileSize(file: File): boolean {
  return file.size <= getMaxFileSize(file.type);
}

/** Accept string for file inputs */
export const ACCEPT_ALL_MEDIA = [
  ...ACCEPTED_IMAGE_TYPES,
  ...ACCEPTED_VIDEO_TYPES,
  ...ACCEPTED_AUDIO_TYPES,
].join(",");

export const ACCEPT_IMAGES = ACCEPTED_IMAGE_TYPES.join(",");
export const ACCEPT_VIDEOS = ACCEPTED_VIDEO_TYPES.join(",");
export const ACCEPT_AUDIO = ACCEPTED_AUDIO_TYPES.join(",");
