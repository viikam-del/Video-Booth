import { useState, useEffect, useRef } from 'react';
import { BoothSettings, RecordedVideo } from '../types';
import { OVERLAY_TEMPLATES } from '../utils/defaultAssets';
import { DeviceInfo } from '../hooks/useMediaDevices';
import {
  getAllVideos,
  deleteVideo,
  triggerVideoDownload,
  downloadAllVideosBatch,
  selectTargetFolder,
  getSelectedFolderName,
} from '../utils/db';
import {
  X,
  Camera,
  Mic,
  Image as ImageIcon,
  Tv,
  Clock,
  Film,
  Upload,
  Trash2,
  Download,
  Play,
  RotateCcw,
  CheckCircle2,
  Volume2,
  Sparkles,
  Sliders,
  Folder,
  FolderCheck,
  HardDrive,
  AlertTriangle,
} from 'lucide-react';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: BoothSettings;
  onSaveSettings: (newSettings: BoothSettings) => void;
  videoDevices: DeviceInfo[];
  audioDevices: DeviceInfo[];
  audioLevel: number;
}

type TabType = 'devices' | 'overlay' | 'screensaver' | 'timing' | 'videos';

export function AdminPanel({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  videoDevices,
  audioDevices,
  audioLevel,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('devices');
  const [localSettings, setLocalSettings] = useState<BoothSettings>(settings);
  const [recordedVideos, setRecordedVideos] = useState<RecordedVideo[]>([]);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [folderName, setFolderName] = useState<string | null>(getSelectedFolderName());
  const [isDownloadingAll, setIsDownloadingAll] = useState<boolean>(false);

  const overlayFileInputRef = useRef<HTMLInputElement | null>(null);
  const screensaverVideoInputRef = useRef<HTMLInputElement | null>(null);

  // Sync settings when opened
  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
      setFolderName(getSelectedFolderName());
      fetchVideos();
    }
  }, [isOpen, settings]);

  const handlePickFolder = async () => {
    try {
      const name = await selectTargetFolder();
      if (name) {
        setFolderName(name);
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 2000);
      }
    } catch (err: unknown) {
      alert((err as Error)?.message || 'Failed to select folder');
    }
  };

  const handleDownloadAll = async () => {
    if (recordedVideos.length === 0) return;
    setIsDownloadingAll(true);
    await downloadAllVideosBatch(recordedVideos);
    setIsDownloadingAll(false);
  };

  const fetchVideos = async () => {
    const list = await getAllVideos();
    setRecordedVideos(list);
  };

  const handleSave = (updated: BoothSettings) => {
    setLocalSettings(updated);
    onSaveSettings(updated);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  // Upload Custom PNG Overlay
  const handleOverlayFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG recommended with transparency)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      const updated: BoothSettings = {
        ...localSettings,
        overlayPng: dataUrl,
        overlayTemplateId: 'custom',
      };
      handleSave(updated);
      setUploadError(null);
    };
    reader.readAsDataURL(file);
  };

  // Upload Custom Screensaver Video
  const handleScreensaverVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setUploadError('Please select a valid video file (MP4 or WebM)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      const updated: BoothSettings = {
        ...localSettings,
        screensaverType: 'custom-video',
        screensaverVideoUrl: dataUrl,
      };
      handleSave(updated);
      setUploadError(null);
    };
    reader.readAsDataURL(file);
  };

  // Select Preset Overlay Template & Re-generate
  const applyPresetTemplate = (templateId: string) => {
    const template = OVERLAY_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    const generatedPng = template.generate(
      localSettings.coupleNames,
      localSettings.weddingDate,
      localSettings.customHashtag
    );

    const updated: BoothSettings = {
      ...localSettings,
      overlayPng: generatedPng,
      overlayTemplateId: templateId,
    };
    handleSave(updated);
  };

  const handleDeleteVideo = async (id: string) => {
    if (confirm('Are you sure you want to delete this recorded video?')) {
      await deleteVideo(id);
      fetchVideos();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative flex flex-col w-full max-w-5xl h-[92vh] max-h-[850px] bg-[#121118] border border-gold-500/30 rounded-2xl shadow-2xl overflow-hidden text-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gold-500/20 bg-gradient-to-r from-gold-950/40 via-night to-night">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gold-500/10 border border-gold-500/30 text-gold-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-white tracking-wide">
                Wedding Booth Admin Panel
              </h2>
              <p className="text-xs text-gold-300/70">
                Configure cameras, audio, overlays, screensavers, and view recorded videos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {savedNotice && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1 rounded-full animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Changes Saved!
              </span>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition"
              title="Close Admin Panel"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-[#0d0c12] px-6 gap-2 overflow-x-auto text-sm">
          <button
            onClick={() => setActiveTab('devices')}
            className={`flex items-center gap-2 py-3 px-4 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'devices'
                ? 'border-gold-400 text-gold-300 bg-gold-400/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            Camera & Microphone
          </button>

          <button
            onClick={() => setActiveTab('overlay')}
            className={`flex items-center gap-2 py-3 px-4 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'overlay'
                ? 'border-gold-400 text-gold-300 bg-gold-400/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Overlay PNG
          </button>

          <button
            onClick={() => setActiveTab('screensaver')}
            className={`flex items-center gap-2 py-3 px-4 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'screensaver'
                ? 'border-gold-400 text-gold-300 bg-gold-400/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Tv className="w-4 h-4" />
            Screensaver Video
          </button>

          <button
            onClick={() => setActiveTab('timing')}
            className={`flex items-center gap-2 py-3 px-4 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'timing'
                ? 'border-gold-400 text-gold-300 bg-gold-400/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            Countdown & Recording
          </button>

          <button
            onClick={() => setActiveTab('videos')}
            className={`flex items-center gap-2 py-3 px-4 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'videos'
                ? 'border-gold-400 text-gold-300 bg-gold-400/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Film className="w-4 h-4" />
            Recorded Videos ({localSettings.videoCounter || recordedVideos.length})
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: CAMERA & MICROPHONE */}
          {activeTab === 'devices' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Camera Selection */}
                <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 space-y-4">
                  <div className="flex items-center gap-2.5 text-gold-300 font-medium">
                    <Camera className="w-5 h-5 text-gold-400" />
                    <span className="text-base text-white">Select Video Camera</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Choose from any external USB webcam, capture card, or built-in camera.
                  </p>

                  <select
                    value={localSettings.selectedCameraId}
                    onChange={(e) => {
                      const updated = { ...localSettings, selectedCameraId: e.target.value };
                      handleSave(updated);
                    }}
                    className="w-full bg-[#181722] border border-white/20 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-gold-400"
                  >
                    <option value="">Default System Camera</option>
                    {videoDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label}
                      </option>
                    ))}
                  </select>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-sm text-gray-300">Mirror Camera Preview</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.mirrorCamera}
                        onChange={(e) =>
                          handleSave({ ...localSettings, mirrorCamera: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                    </label>
                  </div>
                </div>

                {/* Microphone Selection */}
                <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 space-y-4">
                  <div className="flex items-center gap-2.5 text-gold-300 font-medium">
                    <Mic className="w-5 h-5 text-gold-400" />
                    <span className="text-base text-white">Select Audio Microphone</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Choose from external wireless lavaliers, USB boundary mics, or room mics.
                  </p>

                  <select
                    value={localSettings.selectedMicId}
                    onChange={(e) => {
                      const updated = { ...localSettings, selectedMicId: e.target.value };
                      handleSave(updated);
                    }}
                    className="w-full bg-[#181722] border border-white/20 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-gold-400"
                  >
                    <option value="">Default System Microphone</option>
                    {audioDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label}
                      </option>
                    ))}
                  </select>

                  {/* Real-time VU meter */}
                  <div className="pt-2 space-y-1.5">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Volume2 className="w-3.5 h-3.5 text-gold-400" />
                        Live Mic Input Level
                      </span>
                      <span className="font-mono text-gold-300">{audioLevel}%</span>
                    </div>
                    <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden border border-white/10 p-0.5">
                      <div
                        className="h-full rounded-full transition-all duration-75"
                        style={{
                          width: `${audioLevel}%`,
                          backgroundColor:
                            audioLevel > 80 ? '#ef4444' : audioLevel > 50 ? '#eab308' : '#22c55e',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Resolution and Orientation */}
              <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 space-y-4">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Video Resolution & Aspect Ratio
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Capture Resolution</label>
                    <select
                      value={localSettings.resolution}
                      onChange={(e) =>
                        handleSave({
                          ...localSettings,
                          resolution: e.target.value as BoothSettings['resolution'],
                        })
                      }
                      className="w-full bg-[#181722] border border-white/20 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-gold-400"
                    >
                      <option value="1080p">1080p Full HD (1920 × 1080) - Recommended</option>
                      <option value="720p">720p HD (1280 × 720) - Lighter File Size</option>
                      <option value="4k">4K Ultra HD (3840 × 2160) - High Performance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Aspect Ratio</label>
                    <select
                      value={localSettings.aspectRatio}
                      onChange={(e) =>
                        handleSave({
                          ...localSettings,
                          aspectRatio: e.target.value as BoothSettings['aspectRatio'],
                        })
                      }
                      className="w-full bg-[#181722] border border-white/20 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-gold-400"
                    >
                      <option value="16:9">16:9 Landscape (Standard Kiosk / TV Screen)</option>
                      <option value="9:16">9:16 Portrait (Mobile Stories / Vertical Booth)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Live Camera Feed Preview Box */}
              <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                    <Camera className="w-4 h-4 text-gold-400" />
                    Live Camera Feed Test
                  </span>
                  <span className="text-xs text-gray-400">Verifies camera is transmitting video frames</span>
                </div>
                <div className="relative w-full max-w-lg aspect-video rounded-xl overflow-hidden bg-black border border-white/20 mx-auto">
                  <AdminCameraPreview
                    deviceId={localSettings.selectedCameraId}
                    mirror={localSettings.mirrorCamera}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OVERLAY PNG */}
          {activeTab === 'overlay' && (
            <div className="space-y-6">
              {uploadError && (
                <div className="p-3 text-xs text-red-300 bg-red-950/60 border border-red-500/40 rounded-lg">
                  {uploadError}
                </div>
              )}

              {/* Upload Custom PNG Section */}
              <div className="p-6 rounded-xl bg-white/[0.03] border border-dashed border-gold-500/40 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-3 rounded-full bg-gold-500/10 text-gold-400 border border-gold-400/30">
                    <Upload className="w-8 h-8" />
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Upload Custom Overlay PNG</h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-lg mx-auto">
                    Upload any 1920×1080 transparent PNG with your custom wedding borders, monogram,
                    or sponsor logos. It will be burned directly onto all recorded videos.
                  </p>
                </div>

                <input
                  ref={overlayFileInputRef}
                  type="file"
                  accept="image/png,image/webp"
                  onChange={handleOverlayFileUpload}
                  className="hidden"
                />

                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => overlayFileInputRef.current?.click()}
                    className="px-5 py-2.5 rounded-lg bg-gold-500 hover:bg-gold-600 text-night font-semibold text-sm transition shadow-lg shadow-gold-900/30"
                  >
                    Select PNG File
                  </button>

                  {localSettings.overlayPng && (
                    <button
                      onClick={() => applyPresetTemplate('gold-floral')}
                      className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm transition"
                    >
                      Reset to Default
                    </button>
                  )}
                </div>
              </div>

              {/* Wedding Details Editor (Generates fresh overlays) */}
              <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 space-y-4">
                <div className="flex items-center gap-2 text-gold-300 font-medium">
                  <Sparkles className="w-4 h-4 text-gold-400" />
                  <span className="text-sm text-white">Customize Couple Details for Presets</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Couple Names</label>
                    <input
                      type="text"
                      value={localSettings.coupleNames}
                      onChange={(e) => {
                        const updated = { ...localSettings, coupleNames: e.target.value };
                        setLocalSettings(updated);
                        onSaveSettings(updated);
                      }}
                      className="w-full bg-[#181722] border border-white/20 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-gold-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Wedding Date</label>
                    <input
                      type="text"
                      value={localSettings.weddingDate}
                      onChange={(e) => {
                        const updated = { ...localSettings, weddingDate: e.target.value };
                        setLocalSettings(updated);
                        onSaveSettings(updated);
                      }}
                      className="w-full bg-[#181722] border border-white/20 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-gold-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Hashtag / Subtitle</label>
                    <input
                      type="text"
                      value={localSettings.customHashtag}
                      onChange={(e) => {
                        const updated = { ...localSettings, customHashtag: e.target.value };
                        setLocalSettings(updated);
                        onSaveSettings(updated);
                      }}
                      className="w-full bg-[#181722] border border-white/20 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-gold-400"
                    />
                  </div>
                </div>
              </div>

              {/* Preset Overlay Templates */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Preset Luxury Wedding Overlays
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {OVERLAY_TEMPLATES.map((tmpl) => {
                    const isSelected = localSettings.overlayTemplateId === tmpl.id;
                    return (
                      <div
                        key={tmpl.id}
                        onClick={() => applyPresetTemplate(tmpl.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-gold-500/10 border-gold-400 shadow-md shadow-gold-500/20'
                            : 'bg-white/[0.02] border-white/10 hover:border-white/30'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-sm text-white">{tmpl.name}</span>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-gold-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed">
                            {tmpl.description}
                          </p>
                        </div>
                        <button className="mt-4 w-full py-1.5 text-xs font-medium rounded-lg bg-white/10 hover:bg-gold-500 hover:text-night transition">
                          {isSelected ? 'Active' : 'Apply'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Current Overlay Preview */}
              {localSettings.overlayPng && (
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                    Live Active Overlay Preview
                  </span>
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-white/20 bg-[#151520] flex items-center justify-center">
                    <img
                      src={localSettings.overlayPng}
                      alt="Overlay Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SCREENSAVER VIDEO */}
          {activeTab === 'screensaver' && (
            <div className="space-y-6">
              {/* Enable / Disable Screensaver */}
              <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Enable Screensaver</h3>
                  <p className="text-xs text-gray-400">
                    Display an engaging screensaver when the booth is idle to invite guests to record.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.screensaverEnabled}
                    onChange={(e) =>
                      handleSave({ ...localSettings, screensaverEnabled: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                </label>
              </div>

              {/* Screensaver Mode Choice */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() =>
                    handleSave({ ...localSettings, screensaverType: 'ambient-animation' })
                  }
                  className={`p-5 rounded-xl border cursor-pointer transition ${
                    localSettings.screensaverType === 'ambient-animation'
                      ? 'bg-gold-500/10 border-gold-400 shadow-md'
                      : 'bg-white/[0.02] border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white text-sm">
                      Ambient Romantic Bokeh Animation
                    </span>
                    {localSettings.screensaverType === 'ambient-animation' && (
                      <CheckCircle2 className="w-4 h-4 text-gold-400" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    Built-in smooth golden sparkles, floating fairy lights, and live animated
                    couple monogram. Zero setup needed.
                  </p>
                </div>

                <div
                  onClick={() =>
                    handleSave({ ...localSettings, screensaverType: 'custom-video' })
                  }
                  className={`p-5 rounded-xl border cursor-pointer transition ${
                    localSettings.screensaverType === 'custom-video'
                      ? 'bg-gold-500/10 border-gold-400 shadow-md'
                      : 'bg-white/[0.02] border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white text-sm">Custom Video Loop</span>
                    {localSettings.screensaverType === 'custom-video' && (
                      <CheckCircle2 className="w-4 h-4 text-gold-400" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    Upload your own MP4/WebM video (e.g. pre-wedding photoshoot video, couple story
                    clip, or motion graphic).
                  </p>
                </div>
              </div>

              {/* Upload Custom Video */}
              {localSettings.screensaverType === 'custom-video' && (
                <div className="p-6 rounded-xl bg-white/[0.03] border border-dashed border-gold-500/40 text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="p-3 rounded-full bg-gold-500/10 text-gold-400 border border-gold-400/30">
                      <Film className="w-8 h-8" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Upload Screensaver Video</h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-lg mx-auto">
                      Upload an MP4 or WebM video file. It will continuously loop in full screen
                      until someone presses 'H' or taps the screen.
                    </p>
                  </div>

                  <input
                    ref={screensaverVideoInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/ogg"
                    onChange={handleScreensaverVideoUpload}
                    className="hidden"
                  />

                  <button
                    onClick={() => screensaverVideoInputRef.current?.click()}
                    className="px-5 py-2.5 rounded-lg bg-gold-500 hover:bg-gold-600 text-night font-semibold text-sm transition shadow-lg shadow-gold-900/30"
                  >
                    Select Video File (MP4/WebM)
                  </button>

                  {/* Video Player Preview */}
                  {localSettings.screensaverVideoUrl && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <span className="block text-xs text-gray-400 mb-2">
                        Screensaver Video Preview
                      </span>
                      <video
                        src={localSettings.screensaverVideoUrl}
                        controls
                        loop
                        muted
                        className="max-h-56 mx-auto rounded-lg border border-white/20 shadow-lg"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Screensaver Idle Timeout */}
              <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-white">Idle Timeout Before Screensaver</span>
                  <span className="font-mono text-gold-300 text-sm">
                    {localSettings.screensaverTimeoutSeconds} seconds
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="180"
                  step="5"
                  value={localSettings.screensaverTimeoutSeconds}
                  onChange={(e) =>
                    handleSave({
                      ...localSettings,
                      screensaverTimeoutSeconds: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full accent-gold-500"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>5s (Fast)</span>
                  <span>40s (Recommended)</span>
                  <span>180s (3 min)</span>
                </div>
              </div>

              {/* Screensaver Heading Text */}
              <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 space-y-4">
                <span className="text-sm font-semibold text-white">Screensaver Text Customizer</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Headline Text</label>
                    <input
                      type="text"
                      value={localSettings.screensaverTitle}
                      onChange={(e) =>
                        handleSave({ ...localSettings, screensaverTitle: e.target.value })
                      }
                      className="w-full bg-[#181722] border border-white/20 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-gold-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Subtitle / Subtext</label>
                    <input
                      type="text"
                      value={localSettings.screensaverSubtitle}
                      onChange={(e) =>
                        handleSave({ ...localSettings, screensaverSubtitle: e.target.value })
                      }
                      className="w-full bg-[#181722] border border-white/20 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-gold-400"
                    />
                  </div>
                </div>
              </div>

              {/* Live Camera Feed Preview Box */}
              <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                    <Camera className="w-4 h-4 text-gold-400" />
                    Live Camera Feed Test
                  </span>
                  <span className="text-xs text-gray-400">Verifies camera is transmitting video frames</span>
                </div>
                <div className="relative w-full max-w-lg aspect-video rounded-xl overflow-hidden bg-black border border-white/20 mx-auto">
                  <AdminCameraPreview
                    deviceId={localSettings.selectedCameraId}
                    mirror={localSettings.mirrorCamera}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TIMING & COUNTDOWN */}
          {activeTab === 'timing' && (
            <div className="space-y-6">
              {/* Countdown Duration */}
              <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Countdown Duration Before Recording</h3>
                    <p className="text-xs text-gray-400">
                      Gives guests time to pose and smile after pressing 'H'.
                    </p>
                  </div>
                  <span className="font-mono text-gold-300 text-lg font-bold">
                    {localSettings.countdownSeconds}s
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={localSettings.countdownSeconds}
                  onChange={(e) =>
                    handleSave({
                      ...localSettings,
                      countdownSeconds: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full accent-gold-500"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0s (Immediate)</span>
                  <span>3s (Fast)</span>
                  <span>5s (Standard)</span>
                  <span>10s (Long)</span>
                </div>
              </div>

              {/* Maximum Video Recording Length */}
              <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Maximum Recording Duration</h3>
                    <p className="text-xs text-gray-400">
                      Videos automatically wrap up once this duration is reached, or guest can press 'H' early.
                    </p>
                  </div>
                  <span className="font-mono text-gold-300 text-lg font-bold">
                    {localSettings.maxDurationSeconds === 0
                      ? 'Manual Stop'
                      : `${localSettings.maxDurationSeconds}s`}
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={localSettings.maxDurationSeconds}
                  onChange={(e) =>
                    handleSave({
                      ...localSettings,
                      maxDurationSeconds: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full accent-gold-500"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>5s (Quick)</span>
                  <span>15s (Sweet & Short)</span>
                  <span>30s (Thoughtful)</span>
                  <span>60s (Long Wish)</span>
                </div>
              </div>

              {/* Audio cues and auto download */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Audio Beep & Fanfare Cues</h3>
                    <p className="text-xs text-gray-400">Play pleasant audio beeps during countdown & finish.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.audioBeepEnabled}
                      onChange={(e) =>
                        handleSave({ ...localSettings, audioBeepEnabled: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                  </label>
                </div>

                <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Auto-Download to PC</h3>
                    <p className="text-xs text-gray-400">
                      Automatically triggers browser download to your Downloads folder on each video.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.autoDownload}
                      onChange={(e) =>
                        handleSave({ ...localSettings, autoDownload: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                  </label>
                </div>
              </div>

              {/* Direct Folder Save option */}
              <div className="p-5 rounded-xl bg-gradient-to-r from-gold-500/10 via-white/[0.03] to-white/[0.03] border border-gold-500/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gold-500/20 text-gold-400 border border-gold-500/30">
                      {folderName ? (
                        <FolderCheck className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <Folder className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        Direct Folder Auto-Save (File System Access)
                      </h3>
                      <p className="text-xs text-gray-400">
                        Select a dedicated local folder on your PC (e.g. <span className="font-mono text-gold-300">D:\WeddingVideos</span> or USB drive). Videos will save directly without browser download prompts.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handlePickFolder}
                    className="px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-600 text-night font-bold text-xs transition flex items-center gap-2 shadow-md shadow-gold-900/30"
                  >
                    <Folder className="w-4 h-4" />
                    {folderName ? 'Change Save Folder' : 'Choose Local Folder'}
                  </button>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-gray-400">Current Destination:</span>
                  <span className="font-mono text-gold-300 font-medium">
                    {folderName ? `📁 Local Folder: "${folderName}"` : '📥 Default Browser Downloads folder'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: VIDEO COUNTER & RECORDED VIDEOS GALLERY */}
          {activeTab === 'videos' && (
            <div className="space-y-6">
              {/* Counter Card */}
              <div className="p-6 rounded-xl bg-gradient-to-r from-gold-950/30 to-white/[0.02] border border-gold-500/30 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-gold-500/20 text-gold-400 border border-gold-400/40 font-mono text-3xl font-extrabold px-5">
                    #{String(localSettings.videoCounter || 0).padStart(3, '0')}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white font-serif">
                      Total Wedding Messages Recorded
                    </h3>
                    <p className="text-xs text-gray-400">
                      All videos stored safely in local browser IndexedDB storage with overlays burned in.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {recordedVideos.length > 0 && (
                    <button
                      onClick={handleDownloadAll}
                      disabled={isDownloadingAll}
                      className="px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-600 text-night font-bold text-xs transition flex items-center gap-1.5 shadow-md"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {isDownloadingAll ? 'Downloading Batch...' : 'Download All to PC'}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const num = prompt('Enter new counter number:', String(localSettings.videoCounter || 0));
                      if (num !== null) {
                        const parsed = parseInt(num, 10);
                        if (!isNaN(parsed)) {
                          handleSave({ ...localSettings, videoCounter: parsed });
                        }
                      }
                    }}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-gray-200 transition"
                  >
                    Adjust Counter
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Reset video counter to 0? (Existing videos will not be deleted)')) {
                        handleSave({ ...localSettings, videoCounter: 0 });
                      }
                    }}
                    className="px-4 py-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-xs text-red-300 transition flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Counter
                  </button>
                </div>
              </div>

              {/* Where are videos saved informational banner */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <HardDrive className="w-4 h-4 text-gold-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-white block">1. Local Browser Storage</span>
                    <span className="text-gray-400">
                      Videos persist in browser IndexedDB. Safe across refreshes.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Folder className="w-4 h-4 text-gold-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-white block">2. Dedicated Folder</span>
                    <span className="text-gray-400">
                      {folderName ? `Active: "${folderName}"` : 'Set a custom folder in Timing tab.'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Download className="w-4 h-4 text-gold-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-white block">3. Computer Downloads</span>
                    <span className="text-gray-400">
                      Saved to your Windows Downloads folder automatically or on-demand.
                    </span>
                  </div>
                </div>
              </div>

              {/* Recorded Videos List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white uppercase tracking-wider">
                    Recorded Guest Messages ({recordedVideos.length})
                  </span>
                  <button
                    onClick={fetchVideos}
                    className="text-xs text-gold-400 hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Refresh List
                  </button>
                </div>

                {recordedVideos.length === 0 ? (
                  <div className="p-12 text-center rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                    <Film className="w-10 h-10 text-gray-500 mx-auto" />
                    <p className="text-gray-300 text-sm font-medium">No videos recorded yet</p>
                    <p className="text-xs text-gray-500">
                      Exit admin and press 'H' in the booth to record your first guest video message!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {recordedVideos.map((video) => (
                      <div
                        key={video.id}
                        className="p-3 rounded-xl bg-white/[0.02] border border-white/10 hover:border-gold-500/40 transition flex flex-col justify-between group"
                      >
                        <div className="space-y-2">
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-white/10">
                            {video.thumbnailUrl ? (
                              <img
                                src={video.thumbnailUrl}
                                alt={`Video #${video.videoNumber}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-600">
                                <Film className="w-8 h-8" />
                              </div>
                            )}

                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-gold-400 font-mono text-xs font-bold">
                              #{String(video.videoNumber).padStart(3, '0')}
                            </span>

                            <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-white text-xs font-mono">
                              {video.duration}s
                            </span>

                            {/* Play overlay button */}
                            <button
                              onClick={() => {
                                const url = URL.createObjectURL(video.blob);
                                setPreviewVideoUrl(url);
                              }}
                              className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-gold-500/90 text-night flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg"
                            >
                              <Play className="w-5 h-5 ml-0.5" />
                            </button>
                          </div>

                          <div className="flex justify-between items-center text-xs text-gray-400">
                            <span>{new Date(video.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>{(video.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                          <button
                            onClick={() => triggerVideoDownload(video)}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-gold-500/10 hover:bg-gold-500 text-gold-400 hover:text-night text-xs font-semibold transition flex items-center justify-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" /> Download
                          </button>

                          <button
                            onClick={() => handleDeleteVideo(video.id)}
                            className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-200 text-xs transition"
                            title="Delete Video"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal for In-app Video Preview */}
        {previewVideoUrl && (
          <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
            <div className="relative max-w-4xl w-full bg-night border border-gold-500/30 rounded-2xl p-4 shadow-2xl">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-serif font-bold text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-gold-400" /> Video Playback Preview
                </span>
                <button
                  onClick={() => {
                    URL.revokeObjectURL(previewVideoUrl);
                    setPreviewVideoUrl(null);
                  }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <video
                src={previewVideoUrl}
                controls
                autoPlay
                className="w-full max-h-[70vh] rounded-lg bg-black"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-white/10 bg-[#0d0c12] text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Booth Ready • Press 'H' anytime to record</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-gold-500 hover:bg-gold-600 text-night font-bold text-xs uppercase tracking-wider transition"
          >
            Done & Return to Booth
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminCameraPreview({ deviceId, mirror }: { deviceId: string; mirror: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let currentStream: MediaStream | null = null;
    let isCancelled = false;

    async function start() {
      try {
        setError(null);
        const constraints: MediaStreamConstraints = {
          video: deviceId ? { deviceId: { ideal: deviceId } } : true,
          audio: false,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        currentStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          videoRef.current.playsInline = true;
          videoRef.current.play().catch(console.warn);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setError((err as Error)?.message || 'Failed to start camera preview');
        }
      }
    }

    start();

    return () => {
      isCancelled = true;
      if (currentStream) {
        currentStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [deviceId]);

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-red-300 text-xs">
        <AlertTriangle className="w-6 h-6 mb-1 text-red-400" />
        {error}
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      playsInline
      muted
      autoPlay
      className={`w-full h-full object-cover ${mirror ? '-scale-x-100' : ''}`}
    />
  );
}
