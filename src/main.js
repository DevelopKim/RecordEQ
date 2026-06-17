import { AudioAnalyzer } from './audio/analyzer.js';
import { EQBarsRenderer } from './ui/eqBars.js';
import { WaveformRenderer } from './ui/waveform.js';
import { OverlayRenderer } from './ui/overlay.js';

const analyzer = new AudioAnalyzer();
const eqBars = new EQBarsRenderer(document.getElementById('eq-canvas'));
const waveform = new WaveformRenderer(document.getElementById('wave-canvas'));
const overlay = new OverlayRenderer(document.getElementById('bg-canvas'));

const statusBadge = document.getElementById('status-badge');
const startScreen = document.getElementById('start-screen');
const micBtn = document.getElementById('mic-btn');

let lastTime = performance.now();
let running = false;

function setStatus(mode) {
  if (mode === 'live') {
    statusBadge.textContent = '● LIVE';
    statusBadge.className = 'live';
  } else {
    statusBadge.textContent = '● DEMO';
    statusBadge.className = 'demo';
  }
}

function loop(now) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  analyzer.tick(dt);
  eqBars.draw(analyzer.bands, analyzer.peaks);
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

// "또는 DEMO 모드로 계속" 클릭
startScreen.querySelector('p').addEventListener('click', () => {
  startScreen.classList.add('hidden');
});

// init: start in demo mode immediately
analyzer.startDemo();
setStatus('demo');
overlay.draw();

if (!running) {
  running = true;
  requestAnimationFrame(loop);
}
