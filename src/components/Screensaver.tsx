import { useEffect, useRef } from 'react';
import { BoothSettings } from '../types';
import { Heart, Sparkles, Video } from 'lucide-react';

interface ScreensaverProps {
  settings: BoothSettings;
  onDismiss: () => void;
}

export function Screensaver({ settings, onDismiss }: ScreensaverProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Romantic ambient canvas animation when not using custom video
  useEffect(() => {
    if (settings.screensaverType === 'custom-video' && settings.screensaverVideoUrl) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particles: golden bokeh and stars
    interface Particle {
      x: number;
      y: number;
      radius: number;
      speedY: number;
      speedX: number;
      alpha: number;
      alphaDelta: number;
      color: string;
    }

    const particles: Particle[] = [];
    const count = 75;
    const colors = ['#D4AF37', '#F7E7CE', '#FFEAA7', '#CCA247', '#E3CF99'];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 4 + 1.2,
        speedY: -(Math.random() * 0.4 + 0.15),
        speedX: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.7 + 0.2,
        alphaDelta: (Math.random() * 0.01 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const render = () => {
      // Luxury dark velvet background gradient
      const bgGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        100,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.8
      );
      bgGrad.addColorStop(0, '#15131C');
      bgGrad.addColorStop(0.5, '#0C0A10');
      bgGrad.addColorStop(1, '#050407');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw and update glowing bokeh particles
      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.alpha += p.alphaDelta;

        if (p.alpha > 0.85 || p.alpha < 0.15) {
          p.alphaDelta = -p.alphaDelta;
        }

        if (p.y < -20) {
          p.y = height + 20;
          p.x = Math.random() * width;
        }
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;

        ctx.save();
        ctx.globalAlpha = Math.max(0.05, Math.min(1, p.alpha));
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.radius * 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [settings.screensaverType, settings.screensaverVideoUrl]);

  return (
    <div
      onClick={onDismiss}
      className="fixed inset-0 z-40 flex flex-col items-center justify-center cursor-pointer select-none bg-black overflow-hidden transition-opacity duration-700 animate-fade-in"
    >
      {/* Custom Video Option */}
      {settings.screensaverType === 'custom-video' && settings.screensaverVideoUrl ? (
        <video
          src={settings.screensaverVideoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover brightness-[0.7]"
        />
      ) : (
        /* Ambient Animated Canvas */
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      )}

      {/* Romantic Overlay Card */}
      <div className="relative z-10 flex flex-col items-center max-w-2xl px-8 py-12 mx-4 text-center rounded-3xl bg-black/45 backdrop-blur-md border border-gold-400/30 shadow-2xl shadow-gold-900/40 transform transition hover:scale-[1.02] duration-300">
        <div className="flex items-center justify-center w-16 h-16 mb-5 rounded-full bg-gold-500/10 border border-gold-400/40 text-gold-400 animate-pulse-slow">
          <Heart className="w-8 h-8 fill-gold-400/30 stroke-gold-400" />
        </div>

        <p className="text-xs uppercase tracking-[0.35em] text-gold-300 font-sans mb-3 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-gold-400" />
          Wedding Video Guestbook
          <Sparkles className="w-3.5 h-3.5 text-gold-400" />
        </p>

        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-white font-bold tracking-tight mb-2 drop-shadow-md">
          {settings.coupleNames || 'Sarah & Michael'}
        </h1>

        <p className="text-sm sm:text-base text-gold-200/90 font-serif italic mb-6">
          {settings.weddingDate || 'Together Forever'}
        </p>

        <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-gold-400 to-transparent mb-6" />

        <h2 className="text-xl sm:text-2xl font-serif text-white/95 font-medium mb-3">
          {settings.screensaverTitle || 'Leave a Video Message for the Newlyweds!'}
        </h2>

        {/* Big Inviting CTA with 'H' Key indicator */}
        <div className="mt-4 flex flex-col items-center gap-3">
          <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-gold-500/30 to-gold-400/30 border border-gold-400/60 shadow-lg text-white font-medium">
            <span className="flex items-center justify-center w-7 h-7 rounded-md bg-gold-400 text-night font-bold text-sm tracking-wider shadow">
              H
            </span>
            <span className="text-base sm:text-lg">
              Press <span className="text-gold-300 font-semibold">'H'</span> on keyboard or Tap Screen
            </span>
            <Video className="w-5 h-5 text-gold-300 ml-1 animate-bounce" />
          </div>

          <p className="text-xs text-white/60 tracking-wider">
            {settings.screensaverSubtitle || 'A quick countdown will begin before recording starts'}
          </p>
        </div>
      </div>

      {/* Subtle bottom indicator */}
      <div className="absolute bottom-6 text-center text-xs tracking-widest text-gold-200/40 uppercase">
        Tap anywhere to record
      </div>
    </div>
  );
}
