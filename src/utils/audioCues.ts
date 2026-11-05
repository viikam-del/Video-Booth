// Web Audio API helper for zero-dependency sound effects & mic volume analysis

class AudioCueController {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStreamSource: MediaStreamAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;

  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Play crisp countdown tick (higher pitch as countdown nears 0)
  playCountdownTick(remainingSeconds: number) {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Pitch goes up on 1
      const freq = remainingSeconds <= 1 ? 880 : 587.33; // A5 vs D5
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch {
      // Audio playback might be prevented before user gesture
    }
  }

  // Festive chime when recording begins
  playRecordStartChime() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Major triad fanfare)

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + idx * 0.07;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.36);
      });
    } catch {
      // ignore
    }
  }

  // Joyful celebration chime when recording completes
  playCelebrationChime() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const chord = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6

      chord.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 1.25);
      });
    } catch {
      // ignore
    }
  }

  // Setup mic audio level visualizer
  setupMicAnalyser(stream: MediaStream): () => number {
    try {
      const ctx = this.getContext();
      this.micStreamSource = ctx.createMediaStreamSource(stream);
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.micStreamSource.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      return () => {
        if (!this.analyser || !this.dataArray) return 0;
        this.analyser.getByteFrequencyData(this.dataArray);
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
          sum += this.dataArray[i];
        }
        const avg = sum / this.dataArray.length;
        // Normalize 0 to 100 with boosted sensitivity
        return Math.min(100, Math.round((avg / 128) * 100));
      };
    } catch {
      return () => 0;
    }
  }

  cleanupMicAnalyser() {
    if (this.micStreamSource) {
      try {
        this.micStreamSource.disconnect();
      } catch {
        // ignore
      }
      this.micStreamSource = null;
    }
    this.analyser = null;
    this.dataArray = null;
  }
}

export const audioCues = new AudioCueController();
