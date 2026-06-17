# RecordEQ — 개발 계획서

> 유튜브 촬영 배경용 macOS 네이티브 EQ 비주얼라이저 앱

---

## 1. 프로젝트 개요

### 목적
영상 촬영 시 모니터 화면에 띄울 **보여주기식 EQ 시각화 앱**. 실제 마이크 음성을 실시간으로 분석해 주파수 스펙트럼 바를 애니메이션으로 보여준다. 녹음 기능은 없으며 QuickTime 등 별도 앱에서 진행한다.

### 핵심 요구사항
- macOS 네이티브 앱 (배포 불필요, 로컬 전용)
- 마이크 입력을 받아 EQ 바 실시간 반응
- 화면이 커야 함 (전체화면 또는 대형 윈도우)
- 간지 나는 시각 효과 (네온 글로우, 피크 홀드, 그라디언트)
- 마이크 없어도 DEMO 애니메이션으로 동작

---

## 2. 기술 스택

| 항목 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | **Tauri v2** | Electron 대비 ~8MB, 메모리 ~50MB. 네이티브 WKWebView 사용 |
| 백엔드 | Rust (최소) | 윈도우 설정만. 비즈니스 로직 없음 |
| UI | HTML + CSS + JS (ES Modules) | 별도 프레임워크 없이 순수 Web API |
| 오디오 캡처 | Web Audio API `getUserMedia` | 브라우저 내장, Rust 코드 불필요 |
| FFT 분석 | Web Audio API `AnalyserNode` | 내장 FFT, `getByteFrequencyData()` |
| 렌더링 | Canvas 2D API | 60fps EQ 바, 파형, 글로우 효과 |
| 최소 OS | macOS 12+ (Tauri v2 요구사항) | |

### Swift/Xcode 대신 Tauri를 선택한 이유
- HTML/CSS/JS로 UI 작성 가능 (학습 비용 낮음)
- Web Audio API가 FFT까지 내장 → Rust DSP 코드 불필요
- Xcode 전체 설치 불필요 (Command Line Tools만 필요)
- 번들 크기: ~8MB vs Swift 앱 ~5MB (큰 차이 없음)
- Chromium 미포함 → Electron보다 가볍고 빠름

---

## 3. 파일 구조

```
record-eq/
├── package.json               ← npm 스크립트 (tauri dev / tauri build)
├── src/                       ← 프론트엔드 (HTML/CSS/JS)
│   ├── index.html             (~40 lines)  HTML 쉘, 캔버스 3개
│   ├── style.css              (~120 lines) 다크 테마, 캔버스 배치
│   ├── main.js                (~55 lines)  진입점, 애니메이션 루프
│   ├── audio/
│   │   └── analyzer.js        (~120 lines) Web Audio FFT, 48밴드, 데모 모드
│   └── ui/
│       ├── eqBars.js          (~110 lines) 세그먼트 EQ 바 Canvas 렌더링
│       ├── waveform.js        (~55 lines)  오실로스코프 파형
│       └── overlay.js         (~100 lines) 격자, 주파수 레이블, dB 스케일, 장식
├── src-tauri/                 ← Tauri / Rust 백엔드
│   ├── Cargo.toml
│   ├── build.rs
│   ├── tauri.conf.json        ← 윈도우 설정, 번들 설정
│   ├── Entitlements.plist     ← 마이크 권한 (com.apple.security.device.audio-input)
│   ├── capabilities/
│   │   └── default.json
│   └── src/
│       ├── main.rs            (~5 lines)
│       └── lib.rs             (~7 lines)
└── docs/
    └── PLAN.md                ← 이 파일
```

### 파일 크기 제한
300줄 초과 금지. 각 파일은 단일 책임.

---

## 4. 아키텍처 — 데이터 흐름

```
[마이크]
   │  navigator.mediaDevices.getUserMedia()
   ▼
[MediaStream]
   │  AudioContext.createMediaStreamSource()
   ▼
[AnalyserNode]  fftSize=2048, smoothingTimeConstant=0
   │  getByteFrequencyData() → 1024 주파수 bin
   │  getByteTimeDomainData() → 2048 시간 샘플
   ▼
[AudioAnalyzer.tick()]
   │  로그 스케일 48밴드 집계 (20Hz~20kHz)
   │  지수 평활화 (α=0.18)
   │  피크 홀드 + 감쇠
   ▼
[AudioData]
   │  bands: Float32Array(48)    0.0~1.0
   │  peaks: Float32Array(48)    0.0~1.0
   │  waveform: Float32Array(2048)
   ▼
[requestAnimationFrame 루프 ~60fps]
   ├── EQBarsRenderer.draw()    → eq-canvas
   ├── WaveformRenderer.draw()  → wave-canvas
   └── OverlayRenderer.draw()   → bg-canvas (최초 1회 + resize 시)
```

### DEMO 모드
마이크 미연결 시 수학 함수(sin, random)로 가짜 음악 패턴 생성. 킥 드럼 펄스 + 하이햇 + 노이즈.

---

## 5. 시각 디자인

### 색상 팔레트
```
배경:     #000000  (순수 검정)
세그먼트 하단 (0~68%):  #00FF66  (네온 그린)  글로우: #00CC44
세그먼트 중간 (68~86%): #FFCC00  (옐로우)    글로우: #FFAA00
세그먼트 상단 (86~100%): #FF2222  (레드)     글로우: #FF0000
파형:     #00CCFF  (시안, 35% 투명도)
격자/레이블: #1a1a1a ~ #2a2a2a  (매우 어두운 회색)
```

### 시각 요소
| 요소 | 설명 |
|------|------|
| EQ 바 | 48개 주파수 밴드, 28 LED 세그먼트 스타일, 세그먼트 간 14% 간격 |
| 피크 홀드 | 각 밴드 최고 세그먼트 표시, 천천히 낙하 |
| 글로우 | Canvas `shadowBlur` 10px로 네온 효과 |
| 반사 | 바 아래 25% 높이 미러 (투명도 점감) |
| 파형 | EQ 영역 38% 지점 오실로스코프, 라인 두께 1.5px |
| 격자 | -12, -24, -36 dB 수평선 + 주파수 수직선 (8% 투명 흰색) |
| 주파수 레이블 | 20, 50, 100, 200, 500, 1k, 2k, 5k, 10k, 20k Hz |
| dB 스케일 | 좌측 0, -12, -24, -36 |
| 스캔라인 | 3px 간격 수평선 오버레이 (2.5% 투명도, CRT 느낌) |
| 코너 장식 | 4모서리 L자 선 |

### 레이아웃
```
┌──────────────────────────────────────────────────────┐
│ RECORD EQ                              ● LIVE/DEMO  │ ← header
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ 0dB           │
│  ≈≈≈≈≈≈≈≈≈≈≈≈ (파형) ≈≈≈≈≈≈≈≈≈≈≈≈≈   -12dB          │
│  ||||||||||||||||||||||||||||||||||||   -24dB          │ ← EQ 바
│                                        -36dB          │
│  20  50 100 200 500 1k 2k 5k 10k 20k  Hz             │ ← 레이블
│                                                       │
│  [🎙 마이크 연결]  또는 DEMO 모드로 계속               │ ← start
└──────────────────────────────────────────────────────┘
```

### 윈도우
- 기본 크기: 1280×800, 최소: 900×500
- `decorations: false` (타이틀바 없음)
- 앱 드래그: `-webkit-app-region: drag` (버튼/캔버스 제외)
- Cmd+Q로 종료

---

## 6. 개발 페이즈

### Phase 1 — 기반 구축 ✅ 완료
- [x] Tauri v2 프로젝트 구조 생성
- [x] `AudioAnalyzer` — Web Audio FFT, 48밴드, DEMO 모드
- [x] `EQBarsRenderer` — 세그먼트 바, 피크 홀드, 반사
- [x] `WaveformRenderer` — 오실로스코프
- [x] `OverlayRenderer` — 격자, 레이블, 스캔라인, 코너 장식
- [x] `main.js` — 애니메이션 루프, 마이크 버튼 UX

### Phase 2 — 빌드 & 실행
- [ ] `npm install` → Tauri CLI 설치
- [ ] `npm run dev` → 개발 모드 실행 확인
- [ ] 마이크 권한 다이얼로그 확인
- [ ] 실제 마이크 EQ 반응 확인

### Phase 3 — 폴리싱 (선택)
- [ ] 전체화면 토글 (F 키 단축키)
- [ ] 색상 테마 전환 (단축키로 green/blue/orange)
- [ ] 앱 아이콘 (.icns)
- [ ] `tauri build` → .dmg 생성

---

## 7. 빌드 & 실행 방법

```bash
# 패키지 설치 (최초 1회)
cd /Users/pingvali/repogitory/record-eq
npm install

# 개발 모드 (핫 리로드)
npm run dev

# 프로덕션 빌드 (.app / .dmg)
npm run build
```

### 마이크 권한
- 최초 실행 시 macOS 마이크 권한 다이얼로그 표시
- `Entitlements.plist`에 `com.apple.security.device.audio-input` 포함
- 거부 시 자동으로 DEMO 모드 유지

---

## 8. 의존성

### npm
```json
{
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0"
  }
}
```

### Rust (Cargo.toml)
```toml
[dependencies]
tauri = { version = "2" }
```

### 시스템 요구사항
- Node.js 17+ ✅
- Rust 1.96+ ✅
- Xcode Command Line Tools ✅
- macOS 12 Monterey+

---

## 9. 제외 범위

- 실제 녹음 기능 (QuickTime에서 담당)
- 오디오 파일 재생
- 설정 저장 / 불러오기
- App Store 배포
- Windows / Linux 지원

---

*최종 업데이트: 2026-06-17 (Tauri v2로 전환)*
