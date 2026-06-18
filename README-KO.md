**[English](./README.md) | 한국어**

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License"></a>
  <img src="https://img.shields.io/badge/README-EN%20%7C%20KO-lightgrey" alt="Language">
</p>

# RecordEQ

Tauri v2로 제작한 macOS용 실시간 오디오 EQ 비주얼라이저입니다.

녹화 중 모니터 화면에 띄워두면 마이크 입력에 반응하는 EQ 그래프가 스튜디오 분위기를 연출해줍니다.

---

## 만들게 된 계기

동영상을 찍으려고 보니 뒷배경에 컴퓨터 화면을 넣으면 그럴싸할 것 같았다. 근데 화면이 너무 밋밋한 거다. 뭐라도 살아 움직이는 게 있어야 할 것 같아서 만들었다. 녹음 기능 같은 건 눈 씻고 찾아봐도 없다. 그냥, 폼 나려고 만든 앱이다. 🎛️

---

## 기능

- 마이크 입력을 실시간으로 분석해 주파수 스펙트럼 표시 (20Hz–2kHz, 음성 영역에 최적화)
- 마이크가 없어도 데모 애니메이션으로 동작
- 테마를 실시간으로 전환 가능

## 테마

| 키 | 테마 | 스타일 |
|----|------|--------|
| `T` | **LED** | LED 세그먼트 바 + 피크 홀드 |
| `T` | **Wave** | 부드러운 스펙트럼 필 + 시안-보라 그라디언트 |
| `T` | **Fire** | 불꽃 색상의 네온 글로우 바 |
| `T` | **Rainbow** | 무지개 색상 바 |

`T` 키로 순환하거나 상단 버튼으로 직접 선택할 수 있습니다.

## 조작법

| 입력 | 동작 |
|------|------|
| `T` | 테마 순환 |
| `F` | 전체화면 전환 |

## 기술 스택

- [Tauri v2](https://tauri.app/) — macOS 네이티브 래퍼
- Web Audio API — 마이크 캡처 및 FFT 분석
- Canvas 2D — 60fps 렌더링, 프레임워크 없음

## 실행 방법

```bash
npm install
npm run dev
```

Rust 툴체인과 Tauri CLI가 필요합니다. [Tauri 사전 준비 사항](https://tauri.app/start/prerequisites/)을 참고하세요.

## 개발 방식

이 프로젝트는 [Claude](https://claude.ai)(Anthropic)와 함께 개발했습니다. 기획부터 구현, 디버깅까지 AI와 협업한 결과물입니다.

## 참고

- macOS 전용 (WKWebView 기반)
- 마이크 입력은 실시간 분석에만 사용되며 녹음·저장되지 않습니다
- 개인 로컬 사용 목적으로 제작된 앱입니다
