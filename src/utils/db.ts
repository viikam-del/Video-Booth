import { get, set, del, keys } from 'idb-keyval';
import { BoothSettings, RecordedVideo } from '../types';

const SETTINGS_KEY = 'wedding_booth_settings';
const VIDEO_PREFIX = 'video_record_';

// In-memory directory handle for File System Access API
let customDirectoryHandle: FileSystemDirectoryHandle | null = null;
let customDirectoryName: string | null = null;

export const DEFAULT_SETTINGS: BoothSettings = {
  countdownSeconds: 3,
  maxDurationSeconds: 15,
  selectedCameraId: '',
  selectedMicId: '',
  resolution: '1080p',
  aspectRatio: '16:9',
  mirrorCamera: true,
  overlayPng: null,
  overlayFit: 'contain',
  overlayOpacity: 1,
  overlayTemplateId: 'gold-floral',
  coupleNames: 'Sarah & Michael',
  weddingDate: 'November 2026',
  customHashtag: '#SarahAndMichael2026',
  screensaverEnabled: true,
  screensaverType: 'ambient-animation',
  screensaverVideoUrl: null,
  screensaverTimeoutSeconds: 40,
  screensaverTitle: 'Leave a Video Message for the Newlyweds!',
  screensaverSubtitle: "Press 'H' or tap anywhere to start",
  audioBeepEnabled: true,
  autoDownload: true, // Default to true so videos are saved straight to PC automatically
  videoCounter: 0,
  adminPin: '',
};

// Check if File System Access API is supported
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

// Request user to select a dedicated folder on their hard drive (e.g. D:\WeddingVideos or USB drive)
export async function selectTargetFolder(): Promise<string | null> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('Your browser does not support the File System Access API. Chrome or Edge is recommended.');
  }

  try {
    const dirHandle = await (window as unknown as { showDirectoryPicker: (opts?: unknown) => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker({
      mode: 'readwrite',
    });
    customDirectoryHandle = dirHandle;
    customDirectoryName = dirHandle.name;
    return dirHandle.name;
  } catch (err: unknown) {
    if ((err as Error)?.name === 'AbortError') {
      return null; // user cancelled dialog
    }
    throw err;
  }
}

export function getSelectedFolderName(): string | null {
  return customDirectoryName;
}

// Write video file directly to the selected PC folder
export async function saveVideoDirectlyToFolder(video: {
  blob: Blob;
  videoNumber: number;
  mimeType: string;
}): Promise<boolean> {
  if (!customDirectoryHandle) return false;

  try {
    const ext = video.mimeType.includes('mp4') ? 'mp4' : 'webm';
    const padded = String(video.videoNumber).padStart(3, '0');
    const filename = `Wedding_Message_${padded}.${ext}`;

    const fileHandle = await customDirectoryHandle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(video.blob);
    await writable.close();
    return true;
  } catch (err) {
    console.error('Failed to write video directly to selected folder:', err);
    return false;
  }
}

// Load persistent settings
export async function loadSettings(): Promise<BoothSettings> {
  try {
    const saved = await get<BoothSettings>(SETTINGS_KEY);
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...saved };
    }
  } catch (err) {
    console.error('Failed to load settings from IndexedDB:', err);
  }
  return DEFAULT_SETTINGS;
}

// Save settings
export async function saveSettings(settings: BoothSettings): Promise<void> {
  try {
    await set(SETTINGS_KEY, settings);
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

// Save recorded video into local browser database (IndexedDB)
export async function saveRecordedVideo(video: RecordedVideo): Promise<void> {
  try {
    await set(`${VIDEO_PREFIX}${video.id}`, video);
    // Also increment video counter in settings
    const settings = await loadSettings();
    settings.videoCounter = Math.max(settings.videoCounter, video.videoNumber);
    await saveSettings(settings);
  } catch (err) {
    console.error('Failed to save video to IndexedDB:', err);
  }
}

// Get all recorded videos (sorted latest first)
export async function getAllVideos(): Promise<RecordedVideo[]> {
  try {
    const allKeys = await keys();
    const videoKeys = allKeys.filter((k) => String(k).startsWith(VIDEO_PREFIX));
    const videos: RecordedVideo[] = [];
    for (const k of videoKeys) {
      const v = await get<RecordedVideo>(k);
      if (v) videos.push(v);
    }
    return videos.sort((a, b) => b.timestamp - a.timestamp);
  } catch (err) {
    console.error('Failed to fetch videos from DB:', err);
    return [];
  }
}

// Delete a recorded video
export async function deleteVideo(id: string): Promise<void> {
  try {
    await del(`${VIDEO_PREFIX}${id}`);
  } catch (err) {
    console.error('Failed to delete video:', err);
  }
}

// Download single video helper (saves into browser Downloads folder)
export function triggerVideoDownload(video: { blob: Blob; videoNumber: number; mimeType: string }) {
  const ext = video.mimeType.includes('mp4') ? 'mp4' : 'webm';
  const paddedNum = String(video.videoNumber).padStart(3, '0');
  const filename = `Wedding_Booth_Message_${paddedNum}.${ext}`;

  const url = URL.createObjectURL(video.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 2500);
}

// Download all videos sequentially
export async function downloadAllVideosBatch(videos: RecordedVideo[]): Promise<void> {
  for (let i = 0; i < videos.length; i++) {
    triggerVideoDownload(videos[i]);
    // Stagger downloads by 400ms to allow browser download manager to handle each cleanly
    await new Promise((r) => setTimeout(r, 400));
  }
}
