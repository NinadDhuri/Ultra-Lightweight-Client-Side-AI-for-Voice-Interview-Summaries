# Ultra-Lightweight Client-Side AI for Voice Interview Summaries

A tiny, offline-friendly browser demo that simulates an ultra-light (&lt;30MB) inference pipeline for voice interviews. It summarizes new utterances in real time, detects pauses, and injects contextual filler phrases using the Speech Synthesis API—no servers required.

## Features
- **Client-side only**: heuristic JSON "model" (~12KB) loaded locally; all computation runs in the browser.
- **Fast feedback**: summarization latency is typically &lt;50 ms on modern hardware.
- **Pause-aware fillers**: gap detection triggers contextual fillers and reads them aloud.
- **Metrics surfaced**: displays model size, load time, and latest response time.

## Running the demo
1. Serve the folder over HTTP (many browsers restrict `fetch` for local files). For example:
   ```bash
   python -m http.server 8000
   ```
2. Open `http://localhost:8000` in your browser.
3. Click **Load Mini Model**, add utterances to the transcript, and wait for pauses to hear the filler phrases.

## How it works
- `assets/mini-model.json` encodes a miniature keyword-weight map and filler templates to keep the payload well below 30MB.
- `scripts/app.js` loads the JSON, performs lightweight scoring to build rolling summaries, measures latency, and plays fillers with `speechSynthesis` when pauses exceed the configured threshold.
- `styles.css` provides the neon UI for the transcript, summary, and metrics panels.

## Notes
- The demo avoids network calls after the page is loaded and can run offline.
- Replace the JSON with a small ONNX/WASM model to experiment with a different architecture while keeping the same UI and metrics hooks.
