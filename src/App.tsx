import { useState, useEffect, useMemo } from 'react';
import { BoothSettings } from './types';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from './utils/db';
import { OVERLAY_TEMPLATES } from './utils/defaultAssets';
import { useMediaDevices } from './hooks/useMediaDevices';
import { useBoothRecorder } from './hooks/useBoothRecorder';
import { BoothView } from './components/BoothView';
import { AdminPanel } from './components/AdminPanel';

export function App() {
  const [settings, setSettings] = useState<BoothSettings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);

  // Load persistent settings on launch
  useEffect(() => {
    async function init() {
      const stored = await loadSettings();
      setSettings(stored);
      setSettingsLoaded(true);
    }
    init();
  }, []);

  // Update and persist settings
  const handleUpdateSettings = (updater: BoothSettings | ((prev: BoothSettings) => BoothSettings)) => {
    setSettings((prev) => {
      const updated = typeof updater === 'function' ? updater(prev) : updater;
      saveSettings(updated);
      return updated;
    });
  };

  // Determine active overlay PNG image (custom uploaded or generated preset)
  const activeOverlayImageSrc = useMemo(() => {
    if (settings.overlayPng) {
      return settings.overlayPng;
    }
    // Generate default template
    const tmpl = OVERLAY_TEMPLATES.find((t) => t.id === settings.overlayTemplateId) || OVERLAY_TEMPLATES[0];
    return tmpl.generate(settings.coupleNames, settings.weddingDate, settings.customHashtag);
  }, [
    settings.overlayPng,
    settings.overlayTemplateId,
    settings.coupleNames,
    settings.weddingDate,
    settings.customHashtag,
  ]);

  // Devices hook
  const { videoDevices, audioDevices } = useMediaDevices();

  // Recorder and compositing hook
  const {
    boothState,
    setBoothState,
    countdownRemaining,
    recordingSeconds,
    streamError,
    cameraReady,
    cameraStream,
    lastRecordedVideo,
    audioLevel,
    videoElementRef,
    canvasElementRef,
    startRecordingFlow,
    stopRecording,
    initStreams,
  } = useBoothRecorder({
    settings,
    onUpdateSettings: handleUpdateSettings,
    overlayImageSrc: activeOverlayImageSrc,
  });

  if (!settingsLoaded) {
    return (
      <div className="w-screen h-screen bg-night flex items-center justify-center text-gold-400 font-serif">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-gold-400 border-t-transparent animate-spin" />
          <span className="text-lg tracking-widest uppercase text-gold-300">
            Initializing Wedding Booth...
          </span>
        </div>
      </div>
    );
  }

  return (
    <main className="w-screen h-screen overflow-hidden bg-black">
      {/* Booth Kiosk Guest View */}
      <BoothView
        settings={settings}
        boothState={boothState}
        setBoothState={setBoothState}
        countdownRemaining={countdownRemaining}
        recordingSeconds={recordingSeconds}
        lastRecordedVideo={lastRecordedVideo}
        canvasRef={canvasElementRef}
        videoRef={videoElementRef}
        streamError={streamError}
        cameraReady={cameraReady}
        cameraStream={cameraStream}
        onRetryCamera={initStreams}
        onStartRecording={startRecordingFlow}
        onStopRecording={stopRecording}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Admin Panel Modal */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        settings={settings}
        onSaveSettings={handleUpdateSettings}
        videoDevices={videoDevices}
        audioDevices={audioDevices}
        audioLevel={audioLevel}
      />
    </main>
  );
}

export default App;
