export class NeonBarsRenderer {
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
    const baseY = padTop + availH;

    const unit = availW / count;
    const barW = unit * 0.62;
    const gapX = unit * 0.38;

    for (let i = 0; i < count; i++) {
      const barH = bands[i] * availH;
      if (barH < 1) continue;
      const x = padX + i * unit + gapX / 2;
      const y = baseY - barH;

      const grad = ctx.createLinearGradient(0, baseY, 0, y);
      grad.addColorStop(0,    '#BB0A00');
      grad.addColorStop(0.45, '#FF5500');
      grad.addColorStop(0.82, '#FFCC00');
      grad.addColorStop(1,    '#FFFFD0');

      // outer glow pass
      ctx.save();
      ctx.shadowBlur = 24;
      ctx.shadowColor = '#FF5500';
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, barW, barH);
      ctx.restore();

      // bright core
      ctx.save();
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#FFDD00';
      ctx.fillStyle = 'rgba(255,220,80,0.32)';
      ctx.fillRect(x + barW * 0.28, y, barW * 0.44, barH);
      ctx.restore();
    }

    // peak hold — bright yellow-white line
    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#FFFF00';
    ctx.fillStyle = '#FFFF99';
    for (let i = 0; i < count; i++) {
      if (peaks[i] > 0.02) {
        const x = padX + i * unit + gapX / 2;
        const y = baseY - peaks[i] * availH;
        ctx.fillRect(x, y - 1.5, barW, 2);
      }
    }
    ctx.restore();

    // reflection
    for (let i = 0; i < count; i++) {
      const reflH = Math.min(bands[i] * availH * 0.18, availH * 0.06);
      if (reflH < 1) continue;
      const x = padX + i * unit + gapX / 2;
      const grad = ctx.createLinearGradient(0, baseY, 0, baseY + reflH);
      grad.addColorStop(0, 'rgba(255,80,0,0.2)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(x, baseY, barW, reflH);
    }
  }
}
