export class SpectrumFillRenderer {
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

  _buildPath(ctx, pts, padX, availW, baseY) {
    ctx.beginPath();
    ctx.moveTo(padX, baseY);
    for (let i = 0; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.lineTo(padX + availW, baseY);
    ctx.closePath();
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
    const baseY = padTop + availH;
    const unitW = availW / count;

    const pts = Array.from({ length: count }, (_, i) => ({
      x: padX + (i + 0.5) * unitW,
      y: baseY - bands[i] * availH,
    }));

    // filled mountain
    const fillGrad = ctx.createLinearGradient(0, padTop, 0, baseY);
    fillGrad.addColorStop(0,   'rgba(0,255,230,0.88)');
    fillGrad.addColorStop(0.4, 'rgba(60,80,255,0.65)');
    fillGrad.addColorStop(1,   'rgba(20,0,50,0.12)');

    ctx.save();
    this._buildPath(ctx, pts, padX, availW, baseY);
    ctx.fillStyle = fillGrad;
    ctx.shadowBlur = 28;
    ctx.shadowColor = '#0088FF44';
    ctx.fill();
    ctx.restore();

    // top edge glow line
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 0; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.strokeStyle = '#00FFEE';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 14;
    ctx.shadowColor = '#00FFEE';
    ctx.stroke();
    ctx.restore();

    // mirror reflection below baseline
    ctx.save();
    ctx.translate(0, baseY * 2);
    ctx.scale(1, -1);
    this._buildPath(ctx, pts, padX, availW, baseY);
    ctx.fillStyle = 'rgba(0,180,255,0.1)';
    ctx.fill();
    ctx.restore();

    // peak markers
    ctx.save();
    ctx.fillStyle = '#AAFFEE';
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#00FFEE';
    for (let i = 0; i < count; i++) {
      if (peaks[i] > 0.05) {
        const x = padX + (i + 0.5) * unitW;
        const y = baseY - peaks[i] * availH;
        ctx.fillRect(x - unitW * 0.35, y - 1, unitW * 0.7, 2);
      }
    }
    ctx.restore();
  }
}
