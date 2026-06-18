import { AudioAnalyzer } from './audio/analyzer.js';
import { EQBarsRenderer } from './ui/eqBars.js';
import { SpectrumFillRenderer } from './ui/spectrumFill.js';
import { NeonBarsRenderer } from './ui/neonBars.js';
import { RainbowBarsRenderer } from './ui/rainbowBars.js';
import { WaveformRenderer } from './ui/waveform.js';
import { OverlayRenderer } from './ui/overlay.js';
import { ThemeManager } from './ui/themeManager.js';

const eqCanvas = document.getElementById('eq-canvas');
const analyzer = new AudioAnalyzer();
const themeManager = new ThemeManager({
  classic: new EQBarsRenderer(eqCanvas),
  wave:    new SpectrumFillRenderer(eqCanvas),
  fire:    new NeonBarsRenderer(eqCanvas),
  rainbow: new RainbowBarsRenderer(eqCanvas),
});
const waveform = new WaveformRenderer(document.getElementById('wave-canvas'));
const overlay  = new OverlayRenderer(document.getElementById('bg-canvas'));

const statusBadge = document.getElementById('status-badge');
const startScreen = document.getElementById('start-screen');
const micBtn      = document.getElementById('mic-btn');
const themeBtns   = document.querySelectorAll('.theme-btn');

let lastTime = performance.now();
let running = false;

function setStatus(mode) {
  statusBadge.textContent = mode === 'live' ? '● LIVE' : '● DEMO';
  statusBadge.className   = mode;
}

function applyTheme(name) {
  themeManager.set(name);
  themeBtns.forEach(btn =>
    btn.classList.toggle('active', btn.dataset.theme === name)
  );
}

function loop(now) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;
  analyzer.tick(dt);
  themeManager.getRenderer().draw(analyzer.bands, analyzer.peaks);
  waveform.draw(analyzer.waveform);
  requestAnimationFrame(loop);
}

async function connectMic() {
  micBtn.textContent = '연결 중...';
  micBtn.disabled = true;
  try {
    await analyzer.start();
    setStatus('live');
    startScreen.classList.add('hidden');
  } catch (e) {
    micBtn.textContent = '🎙 마이크 연결';
    micBtn.disabled = false;
    console.warn('Mic unavailable:', e.message);
  }
}

micBtn.addEventListener('click', connectMic);

startScreen.querySelector('p').addEventListener('click', () => {
  startScreen.classList.add('hidden');
});

themeBtns.forEach(btn =>
  btn.addEventListener('click', () => applyTheme(btn.dataset.theme))
);

// T key cycles themes, F key toggles fullscreen
document.addEventListener('keydown', async e => {
  if (e.key === 't' || e.key === 'T') {
    applyTheme(themeManager.next());
  }
  if (e.key === 'f' || e.key === 'F') {
    const win = window.__TAURI__?.window?.getCurrentWindow?.();
    if (win) {
      const full = await win.isFullscreen();
      await win.setFullscreen(!full);
    }
  }
});

analyzer.startDemo();
setStatus('demo');
overlay.draw();

if (!running) {
  running = true;
  requestAnimationFrame(loop);
}
