import { useState, useEffect, useRef, useCallback } from 'react';
import { BoothSettings, BoothState, RecordedVideo } from '../types';
import { audioCues } from '../utils/audioCues';
import { saveRecordedVideo, triggerVideoDownload, saveVideoDirectlyToFolder } from '../utils/db';
import confetti from 'canvas-confetti';

interface UseBoothRecorderProps {
  settings: BoothSettings;
  onUpdateSettings: (updater: (prev: BoothSettings) => BoothSettings) => void;
  overlayImageSrc: string;
}

export function useBoothRecorder({
  settings,
  onUpdateSettings,
  overlayImageSrc,
}: UseBoothRecorderProps) {
  const [boothState, setBoothState] = useState<BoothState>('idle');
  const [countdownRemaining, setCountdownRemaining] = useState<number>(0);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [lastRecordedVideo, setLastRecordedVideo] = useState<RecordedVideo | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // HTML references
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const overlayImgRef = useRef<HTMLImageElement | null>(null);

  // Streams & Recording references
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const getAudioLevelRef = useRef<(() => number) | null>(null);

  // Preload Overlay Image
  useEffect(() => {
    if (!overlayImageSrc) {
      overlayImgRef.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = overlayImageSrc;
    img.onload = () => {
      overlayImgRef.current = img;
    };
  }, [overlayImageSrc]);

  // Robust Camera & Microphone Initialization with graceful fallbacks
  const initStreams = useCallback(async () => {
    try {
      setStreamError(null);
      setCameraReady(false);

      // Stop previous tracks cleanly
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
        cameraStreamRef.current = null;
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }

      // Desired resolution
      let targetWidth = 1920;
      let targetHeight = 1080;
      if (settings.resolution === '720p') {
        targetWidth = 1280;
        targetHeight = 720;
      } else if (settings.resolution === '4k') {
        targetWidth = 3840;
        targetHeight = 2160;
      }

      if (settings.aspectRatio === '9:16') {
        const tmp = targetWidth;
        targetWidth = targetHeight;
        targetHeight = tmp;
      }

      // Step 1: Request Camera
      let videoStream: MediaStream | null = null;
      try {
        const videoConstraints: MediaTrackConstraints = {
          width: { ideal: targetWidth },
          height: { ideal: targetHeight },
        };
        if (settings.selectedCameraId) {
          videoConstraints.deviceId = { ideal: settings.selectedCameraId };
        }
        videoStream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });
      } catch (camErr) {
        console.warn('Initial camera request failed, retrying with basic constraints...', camErr);
        // Fallback: try basic video
        try {
          videoStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch (basicCamErr: unknown) {
          console.error('All camera requests failed:', basicCamErr);
          setStreamError((basicCamErr as Error)?.message || 'Could not access camera. Please allow camera permissions.');
        }
      }

      if (videoStream) {
        cameraStreamRef.current = videoStream;
        setCameraStream(videoStream);
        setCameraReady(true);
        const video = videoElementRef.current;
        if (video) {
          video.srcObject = videoStream;
          video.muted = true;
          video.playsInline = true;
          video.autoplay = true;

          video.onloadedmetadata = async () => {
            try {
              await video.play();
            } catch (playErr) {
              console.warn('video.play() failed:', playErr);
            }
          };

          if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
            video.play().catch(console.warn);
          }
        }
      }

      // Step 2: Request Microphone (resilient, does not block video if mic fails)
      try {
        const audioConstraints: MediaTrackConstraints = {
          echoCancellation: true,
          noiseSuppression: true,
        };
        if (settings.selectedMicId) {
          audioConstraints.deviceId = { ideal: settings.selectedMicId };
        }

        const audioStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: audioConstraints,
        });

        micStreamRef.current = audioStream;
        const getLevel = audioCues.setupMicAnalyser(audioStream);
        getAudioLevelRef.current = getLevel;
      } catch (micErr) {
        console.warn('Microphone request failed (recording will continue without audio or retry):', micErr);
        // Fallback to basic audio
        try {
          const fallbackAudio = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          micStreamRef.current = fallbackAudio;
          const getLevel = audioCues.setupMicAnalyser(fallbackAudio);
          getAudioLevelRef.current = getLevel;
        } catch (fallbackMicErr) {
          console.warn('No microphone available:', fallbackMicErr);
        }
      }
    } catch (err: unknown) {
      console.error('Error in initStreams:', err);
      setStreamError((err as Error)?.message || 'Failed to initialize camera or microphone');
    }
  }, [
    settings.selectedCameraId,
    settings.selectedMicId,
    settings.resolution,
    settings.aspectRatio,
  ]);

  useEffect(() => {
    initStreams();
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      audioCues.cleanupMicAnalyser();
    };
  }, [initStreams]);

  // Audio level polling interval for visualizer
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (getAudioLevelRef.current) {
        setAudioLevel(getAudioLevelRef.current());
      }
    }, 80);
    return () => window.clearInterval(interval);
  }, []);

  // Continuous Canvas Compositing Loop
  useEffect(() => {
    const canvas = canvasElementRef.current;
    const video = videoElementRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let isRunning = true;

    const renderFrame = () => {
      if (!isRunning) return;

      const cw = canvas.width;
      const ch = canvas.height;

      // Check if video has active playable frames
      const hasVideoData =
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA ||
        (video.videoWidth > 0 && video.videoHeight > 0);

      if (hasVideoData) {
        ctx.save();

        // Dark background
        ctx.fillStyle = '#050508';
        ctx.fillRect(0, 0, cw, ch);

        // Mirror video if enabled
        if (settings.mirrorCamera) {
          ctx.translate(cw, 0);
          ctx.scale(-1, 1);
        }

        // Calculate aspect-ratio cover fill
        const vw = video.videoWidth || cw;
        const vh = video.videoHeight || ch;
        const hRatio = cw / vw;
        const vRatio = ch / vh;
        const ratio = Math.max(hRatio, vRatio);
        const centerShiftX = (cw - vw * ratio) / 2;
        const centerShiftY = (ch - vh * ratio) / 2;

        ctx.drawImage(video, 0, 0, vw, vh, centerShiftX, centerShiftY, vw * ratio, vh * ratio);
        ctx.restore();
      } else {
        // Video is still loading or connecting: draw warm placeholder
        ctx.fillStyle = '#0a0910';
        ctx.fillRect(0, 0, cw, ch);

        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(212, 175, 55, 0.6)';
        ctx.font = '500 24px "Playfair Display", Georgia, serif';
        ctx.fillText('Connecting to camera...', cw / 2, ch / 2);
        ctx.restore();
      }

      // Draw Overlay PNG on top
      if (overlayImgRef.current && overlayImgRef.current.complete) {
        ctx.save();
        ctx.globalAlpha = settings.overlayOpacity;

        if (settings.overlayFit === 'contain') {
          const img = overlayImgRef.current;
          const iw = img.naturalWidth || cw;
          const ih = img.naturalHeight || ch;
          const r = Math.min(cw / iw, ch / ih);
          const ox = (cw - iw * r) / 2;
          const oy = (ch - ih * r) / 2;
          ctx.drawImage(img, 0, 0, iw, ih, ox, oy, iw * r, ih * r);
        } else {
          // Default full cover/fill
          ctx.drawImage(overlayImgRef.current, 0, 0, cw, ch);
        }

        ctx.restore();
      }

      animationFrameIdRef.current = requestAnimationFrame(renderFrame);
    };

    animationFrameIdRef.current = requestAnimationFrame(renderFrame);

    return () => {
      isRunning = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [
    settings.mirrorCamera,
    settings.overlayOpacity,
    settings.overlayFit,
    cameraStream,
    cameraReady,
  ]);

  // Reset idle timer
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }

    if (
      settings.screensaverEnabled &&
      settings.screensaverTimeoutSeconds > 0 &&
      boothState === 'idle'
    ) {
      idleTimerRef.current = window.setTimeout(() => {
        setBoothState('screensaver');
      }, settings.screensaverTimeoutSeconds * 1000);
    }
  }, [settings.screensaverEnabled, settings.screensaverTimeoutSeconds, boothState]);

  useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer]);

  // Finish Recording & Save
  const stopRecording = useCallback(() => {
    if (boothState !== 'recording') return;

    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        // Force flush all buffered audio/video chunks
        mediaRecorderRef.current.requestData();
      } catch (err) {
        console.warn('requestData error:', err);
      }
      mediaRecorderRef.current.stop();
    }
  }, [boothState]);

  // Actual recording worker
  const startActualRecording = useCallback(() => {
    setBoothState('recording');
    setRecordingSeconds(0);
    recordedChunksRef.current = [];

    if (settings.audioBeepEnabled) {
      audioCues.playRecordStartChime();
    }

    const canvas = canvasElementRef.current;
    const video = videoElementRef.current;
    if (!canvas) {
      setBoothState('idle');
      return;
    }

    // Force an initial draw onto canvas so captureStream immediately receives a frame
    if (video && video.videoWidth > 0) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
    }

    // Stream from canvas (contains camera + overlay baked in)
    const canvasStream = canvas.captureStream(30);

    // Merge audio from mic
    const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];
    let hasAudioTrack = false;
    if (micStreamRef.current) {
      const audioTracks = micStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0 && audioTracks[0].readyState === 'live') {
        tracks.push(audioTracks[0]);
        hasAudioTrack = true;
      }
    }

    const compositeStream = new MediaStream(tracks);

    // Determine supported mimeType based on audio presence
    const mimeTypesWithAudio = [
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9,opus',
      'video/webm',
      'video/mp4;codecs=avc1,mp4a',
      'video/mp4',
    ];
    const mimeTypesWithoutAudio = [
      'video/webm;codecs=vp8',
      'video/webm;codecs=vp9',
      'video/webm',
      'video/mp4',
    ];

    const candidates = hasAudioTrack ? mimeTypesWithAudio : mimeTypesWithoutAudio;
    let chosenMime = 'video/webm';
    for (const mime of candidates) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) {
        chosenMime = mime;
        break;
      }
    }

    try {
      const recorder = new MediaRecorder(compositeStream, {
        mimeType: chosenMime,
        videoBitsPerSecond: 3_500_000, // 3.5 Mbps for smooth, stable recording
      });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        // Collect recorded blob
        const blob = new Blob(recordedChunksRef.current, { type: chosenMime });

        // Capture thumbnail from current canvas state
        let thumbnailUrl = '';
        if (canvas) {
          thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
        }

        const nextCount = (settings.videoCounter || 0) + 1;
        const newRecord: RecordedVideo = {
          id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          videoNumber: nextCount,
          timestamp: Date.now(),
          duration: recordingSeconds || 1,
          blob,
          thumbnailUrl,
          mimeType: chosenMime,
          fileSize: blob.size,
        };

        // Update settings counter
        onUpdateSettings((prev) => ({
          ...prev,
          videoCounter: nextCount,
        }));

        // Save to IndexedDB
        await saveRecordedVideo(newRecord);

        // Save directly to user-selected folder if configured
        const savedToFolder = await saveVideoDirectlyToFolder(newRecord);

        // Auto download to browser Downloads folder if enabled (and not already written to folder)
        if (settings.autoDownload && !savedToFolder) {
          triggerVideoDownload(newRecord);
        }

        setLastRecordedVideo(newRecord);
        setBoothState('celebration');

        if (settings.audioBeepEnabled) {
          audioCues.playCelebrationChime();
        }

        // Fire celebratory confetti!
        try {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#D4AF37', '#F7E7CE', '#FFFFFF', '#E3CF99'],
          });
        } catch {
          // ignore
        }

        // Auto return to idle after 4.5 seconds celebration preview
        setTimeout(() => {
          setBoothState('idle');
          resetIdleTimer();
        }, 4500);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250); // timeslice every 250ms for reliable chunk flushing

      // Start elapsed timer
      let elapsed = 0;
      recordingTimerRef.current = window.setInterval(() => {
        elapsed += 1;
        setRecordingSeconds(elapsed);

        // Stop automatically if reached max duration limit
        if (settings.maxDurationSeconds > 0 && elapsed >= settings.maxDurationSeconds) {
          stopRecording();
        }
      }, 1000);
    } catch (recorderErr) {
      console.error('Error starting MediaRecorder:', recorderErr);
      setBoothState('idle');
    }
  }, [
    settings.audioBeepEnabled,
    settings.videoCounter,
    settings.autoDownload,
    settings.maxDurationSeconds,
    recordingSeconds,
    onUpdateSettings,
    stopRecording,
    resetIdleTimer,
  ]);

  // Initiate countdown
  const startRecordingFlow = useCallback(() => {
    // If currently screensaver, exit screensaver immediately
    if (boothState === 'screensaver') {
      setBoothState('idle');
    }

    if (boothState === 'recording') {
      stopRecording();
      return;
    }

    if (boothState === 'countdown') {
      return;
    }

    const countdownSec = settings.countdownSeconds;
    if (countdownSec <= 0) {
      startActualRecording();
      return;
    }

    setBoothState('countdown');
    setCountdownRemaining(countdownSec);

    if (settings.audioBeepEnabled) {
      audioCues.playCountdownTick(countdownSec);
    }

    let remaining = countdownSec;
    if (countdownIntervalRef.current) window.clearInterval(countdownIntervalRef.current);

    countdownIntervalRef.current = window.setInterval(() => {
      remaining -= 1;
      setCountdownRemaining(remaining);

      if (remaining > 0) {
        if (settings.audioBeepEnabled) {
          audioCues.playCountdownTick(remaining);
        }
      } else {
        if (countdownIntervalRef.current) {
          window.clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        startActualRecording();
      }
    }, 1000);
  }, [boothState, settings.countdownSeconds, settings.audioBeepEnabled, stopRecording, startActualRecording]);

  // Global "H" keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing inside an input or textarea
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        if (boothState === 'recording') {
          stopRecording();
        } else {
          startRecordingFlow();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [boothState, startRecordingFlow, stopRecording]);

  return {
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
    resetIdleTimer,
  };
}
