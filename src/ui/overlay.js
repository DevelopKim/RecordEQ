const FREQ_LABELS = ['20', '50', '100', '200', '500', '1k', '2k'];
const FREQ_VALUES = [20, 50, 100, 200, 500, 1000, 2000];
const MAX_DISPLAY_FREQ = 2000;
const DB_LABELS = ['0', '-12', '-24', '-36'];
const DB_POSITIONS = [0, 0.33, 0.66, 1.0];

function freqToX(freq, minF, maxF, padX, drawW) {
  return padX + (Math.log10(freq / minF) / Math.log10(maxF / minF)) * drawW;
}

export class OverlayRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    const ro = new ResizeObserver(() => { this._resize(); this.draw(); });
    ro.observe(canvas);
  }

  _resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.canvas.offsetWidth * dpr;
    this.canvas.height = this.canvas.offsetHeight * dpr;
    this.ctx.scale(dpr, dpr);
  }

  draw() {
    if (this.canvas.width === 0) return;
    const ctx = this.ctx;
    const W = this.canvas.offsetWidth;
    const H = this.canvas.offsetHeight;

    ctx.clearRect(0, 0, W, H);

    const padX = W * 0.04;
    const padBottom = H * 0.12;
    const padTop = H * 0.1;
    const availH = H - padBottom - padTop;
    const drawW = W - padX * 2;

    this._drawGrid(ctx, W, H, padX, padTop, padBottom, availH, drawW);
    this._drawFreqLabels(ctx, W, H, padX, padBottom, drawW);
    this._drawDbScale(ctx, W, H, padX, padTop, availH);
    this._drawScanlines(ctx, W, H);
    this._drawCornerDeco(ctx, W, H);
  }

  _drawGrid(ctx, W, H, padX, padTop, padBottom, availH, drawW) {
    ctx.save();
    ctx.strokeStyle = '#ffffff08';
    ctx.lineWidth = 1;

    for (let i = 0; i < DB_POSITIONS.length; i++) {
      const y = padTop + DB_POSITIONS[i] * availH;
      ctx.beginPath();
      ctx.moveTo(padX, y);
      ctx.lineTo(padX + drawW, y);
      ctx.stroke();
    }

    for (const freq of FREQ_VALUES) {
      const x = freqToX(freq, 20, MAX_DISPLAY_FREQ, padX, drawW);
      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, padTop + availH);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawFreqLabels(ctx, W, H, padX, padBottom, drawW) {
    ctx.save();
    ctx.font = '10px "SF Mono", "Fira Code", monospace';
    ctx.fillStyle = '#2a2a2a';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '1px';

    for (let i = 0; i < FREQ_LABELS.length; i++) {
      const x = freqToX(FREQ_VALUES[i], 20, MAX_DISPLAY_FREQ, padX, drawW);
      ctx.fillText(FREQ_LABELS[i], x, H - padBottom * 0.25);
    }

    ctx.fillStyle = '#1a1a1a';
    ctx.textAlign = 'center';
    ctx.font = '9px "SF Mono", monospace';
    ctx.fillText('Hz', W / 2, H - 8);
    ctx.restore();
  }

  _drawDbScale(ctx, W, H, padX, padTop, availH) {
    ctx.save();
    ctx.font = '9px "SF Mono", "Fira Code", monospace';
    ctx.fillStyle = '#252525';
    ctx.textAlign = 'right';

    for (let i = 0; i < DB_LABELS.length; i++) {
      const y = padTop + DB_POSITIONS[i] * availH + 3;
      ctx.fillText(DB_LABELS[i], padX - 6, y);
    }
    ctx.restore();
  }

  _drawScanlines(ctx, W, H) {
    ctx.save();
    ctx.globalAlpha = 0.025;
    ctx.fillStyle = '#000000';
    for (let y = 0; y < H; y += 3) {
      ctx.fillRect(0, y, W, 1);
    }
    ctx.restore();
  }

  _drawCornerDeco(ctx, W, H) {
    const size = 16;
    const pad = 20;
    ctx.save();
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;

    const corners = [
      [pad, pad], [W - pad, pad], [pad, H - pad], [W - pad, H - pad]
    ];

    for (const [cx, cy] of corners) {
      const dx = cx < W / 2 ? 1 : -1;
      const dy = cy < H / 2 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(cx + dx * size, cy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx, cy + dy * size);
      ctx.stroke();
    }
    ctx.restore();
  }
}
