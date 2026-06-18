const BAND_COUNT = 48;
const FFT_SIZE = 2048;
const MIN_FREQ = 20;
const MAX_FREQ = 2000;
const PEAK_DECAY = 0.004;
const SMOOTH = 0.82;
const NOISE_FLOOR = 0.05;

export class AudioAnalyzer {
  constructor() {
    this.bands = new Float32Array(BAND_COUNT);
    this.waveform = new Float32Array(FFT_SIZE);
    this.peaks = new Float32Array(BAND_COUNT);
    this._smoothed = new Float32Array(BAND_COUNT);
    this._ctx = null;
    this._analyser = null;
    this._freqData = null;
    this._timeData = null;
    this._demo = false;
    this._demoPhase = 0;
  }

  async start() {
    // Create AudioContext synchronously before any await — must stay in user gesture context
    this._ctx = new AudioContext({ sampleRate: 44100 });

    // WebKit unlock: play a 1-frame silent buffer to force AudioContext into running state
    const silentBuf = this._ctx.createBuffer(1, 1, 22050);
    const silentSrc = this._ctx.createBufferSource();
    silentSrc.buffer = silentBuf;
    silentSrc.connect(this._ctx.destination);
    silentSrc.start(0);

    // Request mic then complete setup — on any failure release all acquired resources
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    try {
      if (this._ctx.state !== 'running') {
        await this._ctx.resume();
      }

      this._analyser = this._ctx.createAnalyser();
      this._analyser.fftSize = FFT_SIZE;
      this._analyser.smoothingTimeConstant = 0;
      this._analyser.minDecibels = -75;
      this._analyser.maxDecibels = -10;
      this._freqData = new Uint8Array(this._analyser.frequencyBinCount);
      this._timeData = new Uint8Array(FFT_SIZE);

      const source = this._ctx.createMediaStreamSource(stream);
      source.connect(this._analyser);
    } catch (e) {
      stream.getTracks().forEach(t => t.stop());
      this._ctx.close();
      this._ctx = null;
      throw e;
    }

    this._demo = false;
  }

  startDemo() {
    this._demo = true;
    this._demoPhase = 0;
  }

  tick(dt) {
    if (this._demo) {
      this._tickDemo(dt);
    } else {
      this._tickLive();
    }
    this._updatePeaks();
  }

  _tickLive() {
    this._analyser.getByteFrequencyData(this._freqData);
    this._analyser.getByteTimeDomainData(this._timeData);

    const sampleRate = this._ctx.sampleRate;
    const nyquist = sampleRate / 2;
    const binCount = this._analyser.frequencyBinCount;
    const binWidth = nyquist / binCount;

    for (let i = 0; i < BAND_COUNT; i++) {
      const fLow = MIN_FREQ * Math.pow(MAX_FREQ / MIN_FREQ, i / BAND_COUNT);
      const fHigh = MIN_FREQ * Math.pow(MAX_FREQ / MIN_FREQ, (i + 1) / BAND_COUNT);
      const bLow = Math.max(0, Math.floor(fLow / binWidth));
      const bHigh = Math.min(binCount - 1, Math.ceil(fHigh / binWidth));

      let sum = 0;
      let count = bHigh - bLow + 1;
      for (let b = bLow; b <= bHigh; b++) sum += this._freqData[b];
      const raw = count > 0 ? (sum / count) / 255 : 0;
      const gated = raw > NOISE_FLOOR ? raw : 0;

      this._smoothed[i] = this._smoothed[i] * SMOOTH + gated * (1 - SMOOTH);
      this.bands[i] = this._smoothed[i];
    }

    for (let i = 0; i < FFT_SIZE; i++) {
      this.waveform[i] = (this._timeData[i] / 128) - 1;
    }
  }

  _tickDemo(dt) {
    this._demoPhase += dt;
    const t = this._demoPhase;

    for (let i = 0; i < BAND_COUNT; i++) {
      const f = i / BAND_COUNT;
      let v = Math.pow(1 - f, 1.8) * 0.6 + 0.08;

      // kick pulse at low bands
      const kick = Math.pow(Math.max(0, Math.sin(t * 2.4 * Math.PI)), 10);
      if (i < 8) v += kick * (0.9 - f * 2);

      // hi-hat at high bands
      const hat = Math.pow(Math.max(0, Math.sin(t * 4.8 * Math.PI + 0.8)), 14);
      if (i > 38) v += hat * (f - 0.78) * 2;

      // melodic movement
      v += Math.sin(t * 1.1 + i * 0.35) * 0.07;
      v += Math.sin(t * 2.7 + i * 0.6) * 0.04;
      v += (Math.random() - 0.5) * 0.03;

      this._smoothed[i] = this._smoothed[i] * SMOOTH + Math.max(0, Math.min(1, v)) * (1 - SMOOTH);
      this.bands[i] = this._smoothed[i];
    }

    for (let i = 0; i < FFT_SIZE; i++) {
      this.waveform[i] = Math.sin(t * 6 + i * 0.03) * 0.3 * this.bands[8]
        + Math.sin(t * 12 + i * 0.07) * 0.1;
    }
  }

  _updatePeaks() {
    for (let i = 0; i < BAND_COUNT; i++) {
      if (this.bands[i] > this.peaks[i]) {
        this.peaks[i] = this.bands[i];
      } else {
        this.peaks[i] = Math.max(0, this.peaks[i] - PEAK_DECAY);
      }
    }
  }
}
