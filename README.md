# RecordEQ

A real-time audio EQ visualizer built with Tauri v2 for macOS.

Run it on a monitor in the background while recording, and it reacts to your microphone in real time, giving your setup that studio-vibe look.

---

## Why this exists

I wanted to record videos with my computer screen in the background — but the screen looked painfully boring. Something had to move. So I built this. There's no recording, no mixing, no analysis. It's purely, shamelessly aesthetic. 🎛️

---

## What it does

- Reads microphone input and renders a live frequency spectrum (20Hz–2kHz, tuned for voice)
- Falls back to a smooth demo animation when no mic is connected
- Lets you switch between visual themes on the fly

## Themes

| Key | Theme | Style |
|-----|-------|-------|
| `T` | **LED** | LED segment bars with peak hold |
| `T` | **Wave** | Smooth spectrum fill with cyan-purple gradient |
| `T` | **Fire** | Glowing neon bars in flame colors |
| `T` | **Rainbow** | Full-spectrum hue bars |

Press `T` to cycle through themes, or click the theme buttons in the toolbar.

## Controls

| Input | Action |
|-------|--------|
| `T` | Cycle theme |
| `F` | Toggle fullscreen |

## Tech

- [Tauri v2](https://tauri.app/) — native macOS wrapper
- Web Audio API — microphone capture and FFT analysis
- Canvas 2D — 60fps rendering, no frameworks

## Getting started

```bash
npm install
npm run dev
```

Requires Rust toolchain and Tauri CLI. See [Tauri prerequisites](https://tauri.app/start/prerequisites/).

## Notes

- macOS only (uses WKWebView)
- No audio is recorded or saved — mic input is analyzed in memory only
- This is a local-use personal tool, not intended for distribution
