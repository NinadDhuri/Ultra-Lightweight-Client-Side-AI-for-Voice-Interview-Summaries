# Ultra-Lightweight Client-Side AI for Voice Interview Summaries

A tiny, offline-friendly browser demo that simulates an ultra-light (<30MB) inference pipeline for voice interviews. It summarizes new utterances in real time, detects pauses, and injects contextual filler phrases using the Speech Synthesis API—no servers required.

## Features
- **Client-side only**: heuristic JSON "model" (~12KB) loaded locally; all computation runs in the browser.
- **Fast feedback**: summarization latency is typically <50 ms on modern hardware.
- **Pause-aware fillers**: gap detection triggers contextual fillers and reads them aloud.
- **Metrics surfaced**: displays model size, load time, and latest response time.

## Running the demo locally
The project is static—no build step or dependencies. You only need a modern browser with `speechSynthesis` enabled.

1. Serve the folder over HTTP (browsers restrict `fetch` for local files). From the repo root, run one of:
   ```bash
   # Python 3 built-in server
   python -m http.server 8000

   # or Node.js users
   npx http-server -p 8000
   ```
2. Open `http://localhost:8000` in your browser.
3. Click **Load Mini Model**, type utterances in the Transcript box, and pause to hear the filler phrases.
4. Use **Reset** to clear transcript/summary/state and repeat.

### Offline use
- After the page loads once, the demo works without network connectivity. You can zip the repo and unpack it on a machine with no internet, then run the local server commands above.
- If speech output is muted, ensure the browser tab is allowed to autoplay sound or click once inside the page before expecting audio.

## How it works
- `assets/mini-model.json` encodes a miniature keyword-weight map and filler templates to keep the payload well below 30MB.
- `scripts/app.js` loads the JSON, performs lightweight scoring to build rolling summaries, measures latency, and plays fillers with `speechSynthesis` when pauses exceed the configured threshold.
- `styles.css` provides the neon UI for the transcript, summary, and metrics panels.

## Notes
- The demo avoids network calls after the page is loaded and can run offline.
- Replace the JSON with a small ONNX/WASM model to experiment with a different architecture while keeping the same UI and metrics hooks.
