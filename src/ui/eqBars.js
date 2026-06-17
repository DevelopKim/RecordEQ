const SEGMENTS = 28;
const SEG_GAP_RATIO = 0.14;

function segColor(segIndex) {
  const r = segIndex / SEGMENTS;
  if (r > 0.86) return { fill: '#FF2222', glow: '#FF0000' };
  if (r > 0.68) return { fill: '#FFCC00', glow: '#FFAA00' };
  return { fill: '#00FF66', glow: '#00CC44' };
}

export class EQBarsRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    const ro = new ResizeObserver(() => this._resize());
    ro.observe(canvas);
  }

  _resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.canvas.offsetWidth * dpr;
    this.canvas.height = this.canvas.offsetHeight * dpr;
    this.ctx.scale(dpr, dpr);
  }

  draw(bands, peaks) {
    if (this.canvas.width === 0) return;
    const ctx = this.ctx;
    const W = this.canvas.offsetWidth;
    const H = this.canvas.offsetHeight;

    ctx.clearRect(0, 0, W, H);

    const count = bands.length;
    const padX = W * 0.04;
    const padBottom = H * 0.12;
    const padTop = H * 0.1;
    const availW = W - padX * 2;
    const availH = H - padBottom - padTop;

    const unit = availW / count;
    const barW = unit * 0.72;
    const gap = unit * 0.28;

    const segH = availH / SEGMENTS;
    const segPad = segH * SEG_GAP_RATIO;

    for (let i = 0; i < count; i++) {
      const x = padX + i * unit + gap / 2;
      const baseY = padTop + availH;
      const filledSegs = Math.round(bands[i] * SEGMENTS);
      const peakSeg = Math.round(peaks[i] * SEGMENTS);

      for (let s = 0; s < filledSegs; s++) {
        const { fill, glow } = segColor(s);
        const sy = baseY - (s + 1) * segH + segPad / 2;

        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = glow;
        ctx.fillStyle = fill;
        ctx.fillRect(x, sy, barW, segH - segPad);
        ctx.restore();
      }

      // peak hold segment
      if (peakSeg > filledSegs && peakSeg > 0) {
        const { fill, glow } = segColor(peakSeg);
        const sy = baseY - (peakSeg + 1) * segH + segPad / 2;
        ctx.save();
        ctx.shadowBlur = 14;
        ctx.shadowColor = glow;
        ctx.fillStyle = fill;
        ctx.globalAlpha = 0.9;
        ctx.fillRect(x, sy, barW, segH - segPad);
        ctx.restore();
      }

      // reflection
      if (filledSegs > 0) {
        const reflH = Math.min(filledSegs * segH * 0.25, availH * 0.06);
        const { fill } = segColor(0);
        const grad = ctx.createLinearGradient(0, baseY, 0, baseY + reflH);
        grad.addColorStop(0, fill + '33');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(x, baseY, barW, reflH);
      }
    }
  }
}
