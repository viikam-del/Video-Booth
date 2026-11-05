import { useState, useEffect } from 'react';
import { BoothSettings, BoothState, RecordedVideo } from '../types';
import { Screensaver } from './Screensaver';
import {
  Settings,
  Circle,
  Square,
  Sparkles,
  Heart,
  Video as VideoIcon,
  CheckCircle,
  Camera,
  RefreshCw,
} from 'lucide-react';

interface BoothViewProps {
  settings: BoothSettings;
  boothState: BoothState;
  setBoothState: (state: BoothState) => void;
  countdownRemaining: number;
  recordingSeconds: number;
  lastRecordedVideo: RecordedVideo | null;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  streamError: string | null;
  cameraReady: boolean;
  cameraStream: MediaStream | null;
  onRetryCamera: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onOpenAdmin: () => void;
}

export function BoothView({
  settings,
  boothState,
  countdownRemaining,
  recordingSeconds,
  lastRecordedVideo,
  canvasRef,
  videoRef,
  streamError,
  cameraReady,
  cameraStream,
  onRetryCamera,
  onStartRecording,
  onStopRecording,
  onOpenAdmin,
}: BoothViewProps) {
  const [pinPromptOpen, setPinPromptOpen] = useState<boolean>(false);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);

  // Directly attach the live camera stream to the video element
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      videoRef.current.play().catch(console.warn);
    }
  }, [cameraStream, videoRef]);

  // Handle Admin Click (check PIN if set)
  const handleAdminClick = () => {
    if (settings.adminPin && settings.adminPin.trim().length > 0) {
      setEnteredPin('');
      setPinError(false);
      setPinPromptOpen(true);
    } else {
      onOpenAdmin();
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin === settings.adminPin) {
      setPinPromptOpen(false);
      onOpenAdmin();
    } else {
      setPinError(true);
    }
  };

  // Keyboard shortcut: Escape opens admin
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleAdminClick();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [settings.adminPin]);

  const maxDuration = settings.maxDurationSeconds || 15;
  const progressPercent =
    settings.maxDurationSeconds > 0
      ? Math.min(100, (recordingSeconds / maxDuration) * 100)
      : 100;

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden select-none flex items-center justify-center font-sans">
      {/* 
        The Live Camera Feed Video Element:
        Kept fully active in DOM so the browser hardware video decoder stays running at 60fps.
      */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ zIndex: 0 }}
      />

      {/* 
        The Composited High-Res Canvas:
        Visibly displayed on screen at full size so Chrome's compositor submits 30/60fps frames
        directly to canvas.captureStream(), ensuring recordings have full bitrate, valid frames,
        and never stall at 0 bytes.
      */}
      <canvas
        ref={canvasRef}
        width={settings.aspectRatio === '9:16' ? 1080 : 1920}
        height={settings.aspectRatio === '9:16' ? 1920 : 1080}
        className="relative z-10 w-full h-full object-contain"
      />

      {/* CAMERA NOT CONNECTED / PERMISSION NEEDED CARD */}
      {(!cameraReady || streamError) && boothState !== 'screensaver' && (
        <div className="absolute inset-0 z-35 flex items-center justify-center p-6 bg-black/85 backdrop-blur-md">
          <div className="max-w-md w-full p-8 rounded-3xl bg-[#15131e] border border-gold-500/40 text-center space-y-5 shadow-2xl animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-gold-500/10 border border-gold-400/30 text-gold-400 mx-auto flex items-center justify-center">
              <Camera className="w-8 h-8" />
            </div>

            <div>
              <h2 className="font-serif text-2xl font-bold text-white mb-1">
                Camera Access Needed
              </h2>
              <p className="text-xs text-gray-300 leading-relaxed">
                {streamError
                  ? streamError
                  : 'Please allow camera and microphone permissions so the wedding booth can display live video and record your wishes.'}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={onRetryCamera}
                className="w-full py-3 px-5 rounded-xl bg-gold-500 hover:bg-gold-600 text-night font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-gold-900/30"
              >
                <RefreshCw className="w-4 h-4" />
                Enable Camera & Microphone
              </button>

              <button
                onClick={onOpenAdmin}
                className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition flex items-center justify-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Open Admin & Select Connected Devices
              </button>
            </div>

            <p className="text-[11px] text-gray-500">
              Tip: If you previously blocked camera access, click the camera/lock icon in your browser's address bar to Allow.
            </p>
          </div>
        </div>
      )}

      {/* Top Header Floating Controls */}
      <div className="absolute top-5 left-6 right-6 z-20 flex items-center justify-between pointer-events-none">
        {/* Subtle Video Counter Badge */}
        <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-gold-500/30 text-xs text-gold-300 shadow-lg">
          <Heart className="w-3.5 h-3.5 fill-gold-400 stroke-gold-400" />
          <span className="font-serif tracking-wider">
            {settings.coupleNames || 'Wedding Guestbook'}
          </span>
          <span className="text-white/40">•</span>
          <span className="font-mono font-bold text-white">
            #{String(settings.videoCounter || 0).padStart(3, '0')}
          </span>
        </div>

        {/* Discreet Admin Settings Gear */}
        <button
          onClick={handleAdminClick}
          className="pointer-events-auto p-2.5 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white/70 hover:text-white transition shadow-lg hover:border-gold-400"
          title="Admin Settings (Escape)"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* IDLE STATE: Floating prompt to start (for touchscreen guests) */}
      {boothState === 'idle' && cameraReady && (
        <div className="absolute bottom-10 z-20 flex flex-col items-center gap-3 animate-fade-in pointer-events-none">
          <button
            onClick={onStartRecording}
            className="pointer-events-auto group flex items-center gap-3.5 px-8 py-4 rounded-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-night font-bold text-lg shadow-2xl shadow-gold-500/30 transform hover:scale-105 active:scale-95 transition"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-night/20 text-night font-mono font-bold text-base">
              H
            </span>
            <span>Press 'H' or Tap to Record</span>
            <VideoIcon className="w-5 h-5 group-hover:scale-110 transition" />
          </button>
          <p className="text-xs text-white/70 font-medium tracking-wider drop-shadow-md">
            Leave a personalized video memory for the happy couple!
          </p>
        </div>
      )}

      {/* COUNTDOWN OVERLAY */}
      {boothState === 'countdown' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in pointer-events-none">
          <div className="relative flex items-center justify-center w-52 h-52 sm:w-64 sm:h-64 rounded-full border-4 border-gold-400/50 bg-black/60 shadow-2xl shadow-gold-500/40">
            {/* Spinning decorative ring */}
            <div className="absolute inset-2 rounded-full border border-gold-400/20 animate-spin-slow" />

            <div className="flex flex-col items-center justify-center text-center">
              <span className="font-serif text-7xl sm:text-9xl font-bold text-white animate-scale-in drop-shadow-[0_0_25px_rgba(212,175,55,0.8)]">
                {countdownRemaining}
              </span>
            </div>
          </div>

          <p className="mt-8 text-xl sm:text-2xl font-serif text-gold-300 font-semibold tracking-wide drop-shadow-lg flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-gold-400" />
            Get Ready to Smile!
            <Sparkles className="w-6 h-6 text-gold-400" />
          </p>
          <p className="mt-1 text-sm text-white/80 font-medium">Recording is about to begin...</p>
        </div>
      )}

      {/* RECORDING IN PROGRESS OVERLAY */}
      {boothState === 'recording' && (
        <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-8">
          {/* Top Live Recording Status Bar */}
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-red-950/80 backdrop-blur-md border border-red-500/60 shadow-xl">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <Circle className="relative inline-flex rounded-full h-3.5 w-3.5 fill-red-500 text-red-500" />
              </span>
              <span className="text-sm font-bold tracking-widest text-red-100 uppercase">REC</span>
              <span className="text-white/40">|</span>
              <span className="font-mono text-base font-bold text-white">
                00:{String(recordingSeconds).padStart(2, '0')}
                {settings.maxDurationSeconds > 0 && (
                  <span className="text-xs text-white/60 ml-1">
                    / 00:{String(settings.maxDurationSeconds).padStart(2, '0')}
                  </span>
                )}
              </span>
            </div>

            {/* Circular time remaining badge if duration limit set */}
            {settings.maxDurationSeconds > 0 && (
              <div className="px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-xs font-mono text-gold-300">
                {Math.max(0, settings.maxDurationSeconds - recordingSeconds)}s remaining
              </div>
            )}
          </div>

          {/* Bottom Controls: Finish Recording */}
          <div className="pointer-events-auto flex flex-col items-center gap-3 pb-4">
            <button
              onClick={onStopRecording}
              className="group flex items-center gap-3 px-8 py-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-base shadow-2xl shadow-red-900/50 transform hover:scale-105 active:scale-95 transition"
            >
              <Square className="w-5 h-5 fill-white" />
              <span>Finish & Save Message (Press 'H')</span>
            </button>

            {/* Linear Progress Bar */}
            {settings.maxDurationSeconds > 0 && (
              <div className="w-72 h-2 bg-black/60 rounded-full overflow-hidden border border-white/20">
                <div
                  className="h-full bg-gradient-to-r from-gold-500 to-red-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* CELEBRATION / THANK YOU MODAL */}
      {boothState === 'celebration' && lastRecordedVideo && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in p-6 text-center">
          <div className="max-w-lg w-full p-8 rounded-3xl bg-[#14121b] border border-gold-400/40 shadow-2xl flex flex-col items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
              <CheckCircle className="w-10 h-10" />
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
              Thank You!
            </h2>

            <p className="text-gold-200 font-serif text-lg italic">
              Your wedding wish has been beautifully recorded!
            </p>

            <div className="w-full aspect-video rounded-xl overflow-hidden bg-black border border-white/20 relative shadow-inner my-2">
              <img
                src={lastRecordedVideo.thumbnailUrl}
                alt="Your message preview"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 right-2 px-2.5 py-1 rounded-md bg-black/70 text-xs font-mono text-gold-300">
                Saved as Message #{String(lastRecordedVideo.videoNumber).padStart(3, '0')}
              </span>
            </div>

            <p className="text-xs text-gray-400 tracking-wider">
              {settings.autoDownload
                ? 'Video has been downloaded to your computer and saved to the gallery.'
                : 'Video saved locally in high quality. Next guest up!'}
            </p>

            <div className="w-16 h-1 rounded-full bg-gold-400/50 mt-1 animate-pulse" />
          </div>
        </div>
      )}

      {/* SCREENSAVER OVERLAY */}
      {boothState === 'screensaver' && (
        <Screensaver settings={settings} onDismiss={onStartRecording} />
      )}

      {/* PIN PROMPT MODAL */}
      {pinPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="max-w-xs w-full p-6 rounded-2xl bg-[#181622] border border-gold-500/40 text-center space-y-4 shadow-2xl">
            <div className="p-3 w-12 h-12 rounded-full bg-gold-500/20 text-gold-400 mx-auto flex items-center justify-center">
              <Settings className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-white">Admin Passcode</h3>
            <p className="text-xs text-gray-400">Enter the admin PIN to access settings</p>

            <form onSubmit={handlePinSubmit} className="space-y-3">
              <input
                type="password"
                autoFocus
                value={enteredPin}
                onChange={(e) => {
                  setEnteredPin(e.target.value);
                  setPinError(false);
                }}
                placeholder="Enter PIN"
                className="w-full p-2.5 text-center text-lg font-mono tracking-widest bg-black/50 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold-400"
              />

              {pinError && <p className="text-xs text-red-400">Incorrect PIN. Try again.</p>}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPinPromptOpen(false)}
                  className="w-1/2 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 rounded-lg bg-gold-500 hover:bg-gold-600 text-xs font-bold text-night"
                >
                  Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
