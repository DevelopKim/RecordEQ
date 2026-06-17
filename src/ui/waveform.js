const WAVE_COLOR = '#00CCFF';
const WAVE_ALPHA = 0.35;
const SAMPLE_STEP = 4;

export class WaveformRenderer {
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

  draw(waveform) {
    if (this.canvas.width === 0) return;
    const ctx = this.ctx;
    const W = this.canvas.offsetWidth;
    const H = this.canvas.offsetHeight;

    ctx.clearRect(0, 0, W, H);

    const centerY = H * 0.38;
    const amplitude = H * 0.12;
    const padX = W * 0.04;
    const drawW = W - padX * 2;
    const len = waveform.length;

    ctx.save();
    ctx.globalAlpha = WAVE_ALPHA;
    ctx.strokeStyle = WAVE_COLOR;
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 8;
    ctx.shadowColor = WAVE_COLOR;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    for (let i = 0; i < len; i += SAMPLE_STEP) {
      const x = padX + (i / len) * drawW;
      const y = centerY + waveform[i] * amplitude;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }
}
