import { useState, useEffect, useCallback } from 'react';

export interface DeviceInfo {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

export function useMediaDevices() {
  const [videoDevices, setVideoDevices] = useState<DeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<DeviceInfo[]>([]);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        setError('MediaDevices API not supported on this browser.');
        return;
      }

      // First query devices to see if labels are available
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasLabels = devices.some((d) => d.label && d.label.length > 0);

      if (!hasLabels) {
        // Request temporary stream to obtain labels permission
        try {
          const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          tempStream.getTracks().forEach((track) => track.stop());
          setPermissionGranted(true);
        } catch (permErr) {
          console.warn('Initial permission prompt rejected or partially allowed:', permErr);
        }
      } else {
        setPermissionGranted(true);
      }

      const updatedDevices = await navigator.mediaDevices.enumerateDevices();
      
      const vDevs = updatedDevices
        .filter((d) => d.kind === 'videoinput')
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${i + 1}`,
          kind: d.kind,
        }));

      const aDevs = updatedDevices
        .filter((d) => d.kind === 'audioinput')
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${i + 1}`,
          kind: d.kind,
        }));

      setVideoDevices(vDevs);
      setAudioDevices(aDevs);
      setError(null);
    } catch (err: unknown) {
      console.error('Failed to enumerate devices:', err);
      setError((err as Error)?.message || 'Failed to list media devices');
    }
  }, []);

  useEffect(() => {
    refreshDevices();

    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
      };
    }
  }, [refreshDevices]);

  return {
    videoDevices,
    audioDevices,
    permissionGranted,
    refreshDevices,
    error,
  };
}
