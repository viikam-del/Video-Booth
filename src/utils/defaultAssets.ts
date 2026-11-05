// Utility to generate high-resolution wedding overlay PNGs and handle preset overlays

export interface OverlayTemplate {
  id: string;
  name: string;
  description: string;
  generate: (names: string, date: string, hashtag?: string) => string;
}

export const OVERLAY_TEMPLATES: OverlayTemplate[] = [
  {
    id: 'gold-floral',
    name: 'Gold Elegance & Floral',
    description: 'Double golden border with delicate corner filigree and romantic serif typography',
    generate: (names, date, hashtag) => generateGoldFloralOverlay(names, date, hashtag)
  },
  {
    id: 'polaroid',
    name: 'Vintage Polaroid Booth',
    description: 'Charming vintage polaroid frame with handwritten script and gold heart accent',
    generate: (names, date, hashtag) => generatePolaroidOverlay(names, date, hashtag)
  },
  {
    id: 'minimalist',
    name: 'Modern Champagne Minimalist',
    description: 'Clean luxury champagne lines with floating monogram and modern hashtag',
    generate: (names, date, hashtag) => generateMinimalistOverlay(names, date, hashtag)
  },
  {
    id: 'botanical',
    name: 'Romantic Botanical Arch',
    description: 'Graceful botanical arch with golden stardust sparkles and celebration banner',
    generate: (names, date, hashtag) => generateBotanicalOverlay(names, date, hashtag)
  }
];

// 1920 x 1080 Full HD Canvas renderer for Gold Floral
function generateGoldFloralOverlay(names: string, date: string, hashtag?: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 1920, 1080);

  // Outer gold frame
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 4;
  ctx.strokeRect(36, 36, 1920 - 72, 1080 - 72);

  // Inner subtle gold frame
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(48, 48, 1920 - 96, 1080 - 96);

  // Corner floral ornaments
  drawCornerFiligree(ctx, 40, 40, 1, 1);
  drawCornerFiligree(ctx, 1920 - 40, 40, -1, 1);
  drawCornerFiligree(ctx, 40, 1080 - 40, 1, -1);
  drawCornerFiligree(ctx, 1920 - 40, 1080 - 40, -1, -1);

  // Bottom semi-transparent luxury ribbon/scrim
  const gradient = ctx.createLinearGradient(0, 940, 0, 1080);
  gradient.addColorStop(0, 'rgba(15, 12, 8, 0)');
  gradient.addColorStop(0.3, 'rgba(15, 12, 8, 0.55)');
  gradient.addColorStop(1, 'rgba(15, 12, 8, 0.85)');
  ctx.fillStyle = gradient;
  ctx.fillRect(48, 930, 1920 - 96, 1080 - 978);

  // Wedding Names text
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 8;
  ctx.font = '600 44px "Playfair Display", Georgia, serif';
  ctx.fillText(names || 'Sarah & Michael', 960, 1005);

  // Date and hashtag text
  ctx.font = '400 22px "Inter", sans-serif';
  ctx.fillStyle = '#E5C07B';
  ctx.shadowBlur = 4;
  const subText = [date, hashtag].filter(Boolean).join('  •  ');
  ctx.fillText(subText || 'Together Forever', 960, 1040);

  // Top header subtle badge
  ctx.font = '500 20px "Inter", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.letterSpacing = '6px';
  ctx.fillText('— WEDDING GUESTBOOK —', 960, 75);

  return canvas.toDataURL('image/png');
}

function drawCornerFiligree(ctx: CanvasRenderingContext2D, x: number, y: number, scaleX: number, scaleY: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scaleX, scaleY);
  ctx.strokeStyle = '#D4AF37';
  ctx.fillStyle = '#D4AF37';
  ctx.lineWidth = 2;

  // Small corner leaf flourish
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(30, 0, 50, 20);
  ctx.quadraticCurveTo(20, 30, 0, 0);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(0, 30, 20, 50);
  ctx.quadraticCurveTo(30, 20, 0, 0);
  ctx.stroke();

  // Little accent dot
  ctx.beginPath();
  ctx.arc(28, 28, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// 2. Vintage Polaroid Booth
function generatePolaroidOverlay(names: string, date: string, hashtag?: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 1920, 1080);

  // White polaroid border
  ctx.fillStyle = '#FDFDFD';
  // Top, Left, Right borders (45px)
  ctx.fillRect(0, 0, 1920, 45);
  ctx.fillRect(0, 0, 45, 1080);
  ctx.fillRect(1920 - 45, 0, 45, 1080);
  // Bottom thick polaroid chin (140px)
  ctx.fillRect(0, 1080 - 140, 1920, 140);

  // Subtle inner shadow along photo boundary
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.lineWidth = 3;
  ctx.strokeRect(45, 45, 1920 - 90, 1080 - 185);

  // Heart icon in center bottom
  ctx.fillStyle = '#D4AF37';
  ctx.beginPath();
  const hx = 960, hy = 975;
  ctx.moveTo(hx, hy);
  ctx.bezierCurveTo(hx - 12, hy - 14, hx - 22, hy + 4, hx, hy + 22);
  ctx.bezierCurveTo(hx + 22, hy + 4, hx + 12, hy - 14, hx, hy);
  ctx.fill();

  // Script text left & right of heart
  ctx.fillStyle = '#222222';
  ctx.textAlign = 'right';
  ctx.font = '600 36px "Playfair Display", Georgia, serif';
  ctx.fillText(names || 'Our Wedding Day', 930, 990);

  ctx.textAlign = 'left';
  ctx.font = '400 24px "Inter", sans-serif';
  ctx.fillStyle = '#666666';
  ctx.fillText(date || 'Always & Forever', 990, 990);

  if (hashtag) {
    ctx.textAlign = 'center';
    ctx.font = '500 18px "Inter", sans-serif';
    ctx.fillStyle = '#888888';
    ctx.fillText(hashtag, 960, 1030);
  }

  return canvas.toDataURL('image/png');
}

// 3. Modern Champagne Minimalist
function generateMinimalistOverlay(names: string, date: string, hashtag?: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 1920, 1080);

  // Four corner brackets
  const bracketSize = 100;
  const margin = 50;
  ctx.strokeStyle = '#E3CF99';
  ctx.lineWidth = 3;

  // Top-left
  ctx.beginPath();
  ctx.moveTo(margin + bracketSize, margin);
  ctx.lineTo(margin, margin);
  ctx.lineTo(margin, margin + bracketSize);
  ctx.stroke();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(1920 - margin - bracketSize, margin);
  ctx.lineTo(1920 - margin, margin);
  ctx.lineTo(1920 - margin, margin + bracketSize);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(margin, 1080 - margin - bracketSize);
  ctx.lineTo(margin, 1080 - margin);
  ctx.lineTo(margin + bracketSize, 1080 - margin);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(1920 - margin - bracketSize, 1080 - margin);
  ctx.lineTo(1920 - margin, 1080 - margin);
  ctx.lineTo(1920 - margin, 1080 - margin - bracketSize);
  ctx.stroke();

  // Bottom Glassmorphic card
  ctx.fillStyle = 'rgba(18, 18, 22, 0.7)';
  ctx.beginPath();
  ctx.roundRect(960 - 360, 950, 720, 85, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(227, 207, 153, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Text inside card
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 32px "Playfair Display", Georgia, serif';
  ctx.fillText(names || 'Celebrating Our Love', 960, 990);

  ctx.fillStyle = '#CCA247';
  ctx.font = '400 18px "Inter", sans-serif';
  const sub = [date, hashtag].filter(Boolean).join(' • ');
  ctx.fillText(sub || 'Wedding Video Guestbook', 960, 1018);

  return canvas.toDataURL('image/png');
}

// 4. Botanical Arch
function generateBotanicalOverlay(names: string, date: string, hashtag?: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 1920, 1080);

  // Elegant arch border
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.7)';
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  // Draw an elegant inner frame with arched top corners
  ctx.roundRect(60, 60, 1920 - 120, 1080 - 120, [40, 40, 20, 20]);
  ctx.stroke();

  // Draw floating stardust particles along edges
  ctx.fillStyle = '#FFE599';
  const sparkles = [
    [100, 100, 3], [1820, 100, 4], [120, 980, 2.5], [1800, 980, 3],
    [960, 50, 3.5], [400, 65, 2], [1520, 65, 2]
  ];
  sparkles.forEach(([x, y, r]) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Footer gradient
  const grad = ctx.createLinearGradient(0, 950, 0, 1080);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.5, 'rgba(10,15,12,0.65)');
  grad.addColorStop(1, 'rgba(10,15,12,0.9)');
  ctx.fillStyle = grad;
  ctx.fillRect(60, 940, 1920 - 120, 1080 - 990);

  // Footer text
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 42px "Playfair Display", Georgia, serif';
  ctx.fillText(names || 'Happily Ever After', 960, 1005);

  ctx.font = '400 20px "Inter", sans-serif';
  ctx.fillStyle = '#A3C9A8'; // Soft eucalyptus sage green
  ctx.fillText([date, hashtag].filter(Boolean).join('  —  ') || 'Leave a Message', 960, 1038);

  return canvas.toDataURL('image/png');
}
