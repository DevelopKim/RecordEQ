export class RainbowBarsRenderer {
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

  // Map band index to hue: red(0°) → violet(270°) across frequency range
  _hue(i, count) {
    return Math.round((i / count) * 270);
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
      const hue = this._hue(i, count);

      const grad = ctx.createLinearGradient(0, baseY, 0, y);
      grad.addColorStop(0,   `hsla(${hue},100%,18%,0.8)`);
      grad.addColorStop(0.5, `hsla(${hue},100%,48%,0.9)`);
      grad.addColorStop(1,   `hsla(${hue},100%,72%,1.0)`);

      // outer glow
      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = `hsl(${hue},100%,55%)`;
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, barW, barH);
      ctx.restore();

      // bright core streak
      ctx.save();
      ctx.shadowBlur = 5;
      ctx.shadowColor = `hsl(${hue},100%,85%)`;
      ctx.fillStyle = `hsla(${hue},100%,88%,0.28)`;
      ctx.fillRect(x + barW * 0.28, y, barW * 0.44, barH);
      ctx.restore();
    }

    // peak hold
    ctx.save();
    for (let i = 0; i < count; i++) {
      if (peaks[i] > 0.02) {
        const hue = this._hue(i, count);
        const x = padX + i * unit + gapX / 2;
        const y = baseY - peaks[i] * availH;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `hsl(${hue},100%,85%)`;
        ctx.fillStyle = `hsl(${hue},100%,92%)`;
        ctx.fillRect(x, y - 1.5, barW, 2);
      }
    }
    ctx.restore();

    // reflection
    for (let i = 0; i < count; i++) {
      const reflH = Math.min(bands[i] * availH * 0.18, availH * 0.06);
      if (reflH < 1) continue;
      const x = padX + i * unit + gapX / 2;
      const hue = this._hue(i, count);
      const grad = ctx.createLinearGradient(0, baseY, 0, baseY + reflH);
      grad.addColorStop(0, `hsla(${hue},100%,50%,0.18)`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(x, baseY, barW, reflH);
    }
  }
}
