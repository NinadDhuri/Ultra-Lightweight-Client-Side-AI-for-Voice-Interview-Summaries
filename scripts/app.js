const transcriptEl = document.getElementById('transcript');
const summaryEl = document.getElementById('summary');
const fillerEl = document.getElementById('fillerText');
const pauseStateEl = document.getElementById('pauseState');
const modelSizeEl = document.getElementById('modelSize');
const loadTimeEl = document.getElementById('loadTime');
const responseTimeEl = document.getElementById('responseTime');
const statusEl = document.getElementById('status');
const utteranceInput = document.getElementById('utteranceInput');

const state = {
  model: null,
  transcript: [],
  lastUpdate: performance.now(),
  lastFiller: 0,
  pauseHandle: null,
};

class UltraLiteModel {
  constructor(cfg) {
    this.cfg = cfg;
    this.keywordScores = cfg.summary.keywords;
    this.decay = cfg.summary.decay;
    this.templates = cfg.fillers.templates;
    this.pauseMs = cfg.fillers.pauseMs;
    this.voiceHint = cfg.fillers.voiceHint;
  }

  summarize(utterances) {
    const t0 = performance.now();
    const sentences = utterances.map((u) => u.text);
    const scores = sentences.map((s, idx) => this.scoreSentence(s, idx, sentences.length));
    const topSentences = sentences
      .map((s, i) => ({ text: s, score: scores[i] }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .sort((a, b) => sentences.indexOf(a.text) - sentences.indexOf(b.text))
      .map((s) => s.text);

    const summary = topSentences.length ? topSentences.join('\n') : 'Waiting for speech...';
    const t1 = performance.now();
    responseTimeEl.textContent = `${(t1 - t0).toFixed(1)} ms`;
    return summary;
  }

  scoreSentence(sentence, idx, total) {
    const tokens = sentence.toLowerCase().split(/[^a-z0-9]+/g).filter(Boolean);
    let score = 0;
    for (const token of tokens) {
      const weight = this.keywordScores[token];
      if (weight) score += weight;
    }
    const recency = Math.pow(this.decay, total - idx - 1);
    return score * (1 + recency);
  }

  generateFiller(context) {
    const tokens = context
      .join(' ')
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .filter(Boolean);
    const keyword = tokens.find((t) => this.keywordScores[t]) || 'this point';
    const template = this.templates[Math.floor(Math.random() * this.templates.length)];
    return template.replace('{topic}', keyword);
  }
}

async function loadModel() {
  const t0 = performance.now();
  const res = await fetch('assets/mini-model.json');
  const cfg = await res.json();
  const model = new UltraLiteModel(cfg);
  const t1 = performance.now();
  state.model = model;
  modelSizeEl.textContent = `${cfg.sizeKB} KB`;
  loadTimeEl.textContent = `${(t1 - t0).toFixed(1)} ms`;
  statusEl.textContent = `Loaded "${cfg.name}" model`; 
  state.lastUpdate = performance.now();
  startPauseMonitor();
}

function renderTranscript() {
  transcriptEl.innerHTML = '';
  state.transcript.forEach((u) => {
    const div = document.createElement('div');
    div.className = 'utterance';
    const time = document.createElement('time');
    time.textContent = new Date(u.at).toLocaleTimeString();
    const text = document.createElement('div');
    text.textContent = u.text;
    div.append(time, text);
    transcriptEl.appendChild(div);
  });
}

function addUtterance() {
  const text = utteranceInput.value.trim();
  if (!text || !state.model) {
    statusEl.textContent = state.model ? 'Type something to add.' : 'Load the model first.';
    return;
  }
  const at = Date.now();
  state.transcript.push({ text, at });
  utteranceInput.value = '';
  renderTranscript();
  const summary = state.model.summarize(state.transcript);
  summaryEl.textContent = summary;
  state.lastUpdate = performance.now();
}

function startPauseMonitor() {
  if (state.pauseHandle) cancelAnimationFrame(state.pauseHandle);
  const tick = () => {
    const now = performance.now();
    const idleFor = now - state.lastUpdate;
    const threshold = state.model?.pauseMs ?? 3000;
    if (state.model && idleFor > threshold && now - state.lastFiller > threshold) {
      triggerFiller();
      state.lastFiller = now;
    }
    pauseStateEl.textContent = state.model ? `${Math.max(0, Math.round(threshold - idleFor))} ms until filler` : 'Waiting...';
    state.pauseHandle = requestAnimationFrame(tick);
  };
  state.pauseHandle = requestAnimationFrame(tick);
}

function triggerFiller() {
  if (!state.model || !state.transcript.length) return;
  const context = state.transcript.slice(-3).map((u) => u.text);
  const filler = state.model.generateFiller(context);
  fillerEl.textContent = filler;
  speak(filler, state.model.voiceHint);
}

function speak(text, lang) {
  if (!('speechSynthesis' in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  const preferred = speechSynthesis
    .getVoices()
    .find((voice) => voice.lang.startsWith(lang) || voice.name.toLowerCase().includes('en'));
  if (preferred) utterance.voice = preferred;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

function resetDemo() {
  state.transcript = [];
  state.lastUpdate = performance.now();
  state.lastFiller = 0;
  transcriptEl.innerHTML = '';
  summaryEl.textContent = 'Cleared. Add new utterances to rebuild the summary.';
  fillerEl.textContent = '–';
  pauseStateEl.textContent = 'Waiting...';
  responseTimeEl.textContent = '–';
}

function bindUI() {
  document.getElementById('loadModelBtn').addEventListener('click', loadModel);
  document.getElementById('addUtteranceBtn').addEventListener('click', addUtterance);
  document.getElementById('resetBtn').addEventListener('click', resetDemo);
  utteranceInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      addUtterance();
    }
  });
}

bindUI();
startPauseMonitor();
