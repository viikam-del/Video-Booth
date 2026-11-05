export interface BoothSettings {
  // Timing
  countdownSeconds: number; // e.g. 3, 5
  maxDurationSeconds: number; // e.g. 15, 30 (0 = unlimited / manual stop)
  
  // Devices
  selectedCameraId: string;
  selectedMicId: string;
  resolution: '1080p' | '720p' | '4k';
  aspectRatio: '16:9' | '9:16' | '4:3';
  mirrorCamera: boolean;

  // Overlay
  overlayPng: string | null; // Data URL or object URL
  overlayFit: 'contain' | 'cover' | 'fill';
  overlayOpacity: number;
  overlayTemplateId: string; // 'gold-floral' | 'polaroid' | 'minimalist' | 'botanical' | 'custom'

  // Couple Info
  coupleNames: string;
  weddingDate: string;
  customHashtag: string;

  // Screensaver
  screensaverEnabled: boolean;
  screensaverType: 'custom-video' | 'ambient-animation';
  screensaverVideoUrl: string | null; // Data URL or object URL
  screensaverTimeoutSeconds: number; // idle time before showing (0 = disable idle)
  screensaverTitle: string;
  screensaverSubtitle: string;

  // Feedback & Audio
  audioBeepEnabled: boolean;
  autoDownload: boolean;

  // Counter
  videoCounter: number;

  // Security
  adminPin: string; // optional PIN, empty = no lock
}

export interface RecordedVideo {
  id: string;
  videoNumber: number;
  timestamp: number;
  duration: number;
  blob: Blob;
  thumbnailUrl: string;
  mimeType: string;
  fileSize: number;
}

export type BoothState = 
  | 'idle' 
  | 'screensaver' 
  | 'countdown' 
  | 'recording' 
  | 'celebration';
