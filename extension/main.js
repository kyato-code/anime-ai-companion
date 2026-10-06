'use strict';

// ============ Konfigurasi ============
const API_BASE = 'http://localhost:8000';
const REQUEST_TIMEOUT_MS = 120000; // model lokal bisa lambat
const HEALTH_TIMEOUT_MS = 3000;
const HEALTH_INTERVAL_MS = 8000;
const MAX_STORED_MESSAGES = 60;
const STORAGE_KEY = 'hikari.chat.v1';
const GREETING = 'Halo! Aku Hikari, siap nemenin kamu browsing dan cari info apa aja hari ini! ☕✨';

// ============ Utilitas ============
const storage = {
  load(fallback) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
    } catch {
      return fallback;
    }
  },
  save(value) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      /* penyimpanan penuh / dinonaktifkan: abaikan */
    }
  },
};

function newSessionId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

class ApiError extends Error {}

function describeError(err) {
  if (err instanceof ApiError) return err.message;
  if (err?.name === 'AbortError') return 'Hikari kelamaan mikir... coba lagi ya. 😿';
  return 'Meow... aku nggak bisa terhubung ke backend. Pastikan server sudah jalan di localhost:8000. 😿';
}

function extractDetail(data) {
  if (typeof data?.detail === 'string') return data.detail;
  if (Array.isArray(data?.detail)) return 'Pesan tidak valid.';
  return '';
}

// ============ Avatar (mata & mulut mengikuti kursor) ============
function createAvatar() {
  const card = document.querySelector('.character-card');
  const img = document.getElementById('bg-cat');
  const canvas = document.getElementById('eye-canvas');
  const ctx = canvas.getContext('2d');

  // Titik fitur wajah dalam koordinat gambar (0..1), sesuai assets/cat.jpg
  const FOCUS_Y = 0.4; // sama dengan object-position di style.css
  const EYES = [{ x: 0.376, y: 0.436 }, { x: 0.643, y: 0.436 }];
  const MOUTH = { x: 0.51, y: 0.482 };
  const CHEEKS = [{ x: 0.31, y: 0.5 }, { x: 0.7, y: 0.5 }];

  let width = 0;
  let height = 0;
  let pointer = null;
  let thinking = false;
  let talkingUntil = 0;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    width = card.clientWidth;
    height = card.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Padanan object-fit: cover + object-position: 50% FOCUS_Y
  function layout() {
    const iw = img.naturalWidth || 1;
    const ih = img.naturalHeight || 1;
    const scale = Math.max(width / iw, height / ih);
    const offX = (width - iw * scale) * 0.5;
    const offY = (height - ih * scale) * FOCUS_Y;
    return { scale, at: (p) => ({ x: offX + p.x * iw * scale, y: offY + p.y * ih * scale }) };
  }

  const isTalking = () => thinking || performance.now() < talkingUntil;

  function draw(now) {
    ctx.clearRect(0, 0, width, height);
    const { scale: k, at } = layout();
    const target = pointer || { x: width / 2, y: height / 2 };
    const talking = isTalking();

    if (talking) {
      ctx.fillStyle = 'rgba(255, 140, 170, 0.28)';
      for (const c of CHEEKS) {
        const p = at(c);
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 13 * k, 8 * k, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.fillStyle = '#3a2e2b';
    for (const e of EYES) {
      const p = at(e);
      const dx = target.x - p.x;
      const dy = target.y - p.y;
      const angle = Math.atan2(dy, dx);
      const move = Math.min(Math.hypot(dx, dy) / 35, 6.5 * k);
      ctx.beginPath();
      ctx.ellipse(p.x + Math.cos(angle) * move, p.y + Math.sin(angle) * move, 7 * k, 4.5 * k, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (talking) {
      const m = at(MOUTH);
      const open = (2 + (Math.sin(now / 110) + 1) * 3.2) * k;
      ctx.fillStyle = '#8a4f56';
      ctx.beginPath();
      ctx.ellipse(m.x, m.y + 6 * k, 6 * k, open, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  });
  new ResizeObserver(resize).observe(card);
  resize();
  requestAnimationFrame(draw);

  return {
    setThinking(value) { thinking = value; },
    speak(text) { talkingUntil = performance.now() + Math.min(4000, 1200 + text.length * 35); },
  };
}

// ============ Aplikasi ============
document.addEventListener('DOMContentLoaded', () => {
  const els = {
    history: document.getElementById('chat-history'),
    input: document.getElementById('user-input'),
    send: document.getElementById('send-btn'),
    reset: document.getElementById('reset-btn'),
    status: document.getElementById('status'),
    dot: document.getElementById('status-dot'),
    statusText: document.getElementById('status-text'),
  };

  const avatar = createAvatar();
  const state = storage.load({ sessionId: newSessionId(), messages: [] });
  let busy = false;
  let typingEl = null;

  // ----- Render -----
  function addBubble(role, text, { error = false } = {}) {
    const div = document.createElement('div');
    div.className = `message ${role === 'user' ? 'user-message' : 'bot-message'}${error ? ' error-message' : ''}`;
    div.textContent = text; // textContent: aman dari injeksi HTML
    els.history.appendChild(div);
    els.history.scrollTop = els.history.scrollHeight;
    return div;
  }

  function renderAll() {
    els.history.replaceChildren();
    addBubble('bot', GREETING); // sapaan selalu tampil di atas, tidak disimpan
    for (const m of state.messages) addBubble(m.role, m.text);
  }

  function remember(role, text) {
    state.messages.push({ role, text });
    if (state.messages.length > MAX_STORED_MESSAGES) {
      state.messages.splice(0, state.messages.length - MAX_STORED_MESSAGES);
    }
    storage.save(state);
  }

  function showTyping() {
    typingEl = document.createElement('div');
    typingEl.className = 'message bot-message typing';
    typingEl.innerHTML = '<span></span><span></span><span></span>'; // markup statis, aman
    els.history.appendChild(typingEl);
    els.history.scrollTop = els.history.scrollHeight;
  }

  function hideTyping() {
    typingEl?.remove();
    typingEl = null;
  }

  function setBusy(value) {
    busy = value;
    els.send.disabled = value;
    avatar.setThinking(value);
  }

  // ----- Kirim pesan -----
  async function sendMessage() {
    const text = els.input.value.trim();
    if (!text || busy) return;

    setBusy(true);
    els.input.value = '';
    addBubble('user', text);
    remember('user', text);
    showTyping();

    try {
      const res = await fetchWithTimeout(
        `${API_BASE}/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, session_id: state.sessionId }),
        },
        REQUEST_TIMEOUT_MS,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new ApiError(extractDetail(data) || `Server error (${res.status}).`);

      const reply = String(data.reply ?? '').trim() || 'Meow... aku bingung mau jawab apa~';
      hideTyping();
      addBubble('bot', reply);
      remember('bot', reply);
      avatar.speak(reply);
    } catch (err) {
      hideTyping();
      addBubble('bot', describeError(err), { error: true });
      console.error(err);
    } finally {
      setBusy(false);
      els.input.focus();
      checkHealth();
    }
  }

  // ----- Obrolan baru -----
  async function resetChat() {
    if (busy) return;
    const oldId = state.sessionId;
    state.sessionId = newSessionId();
    state.messages = [];
    storage.save(state);
    renderAll();
    els.input.focus();
    // Hapus riwayat di server; kalau gagal tidak masalah (ada batas otomatis).
    fetchWithTimeout(`${API_BASE}/chat/${encodeURIComponent(oldId)}`, { method: 'DELETE' }, 3000).catch(() => {});
  }

  // ----- Status backend -----
  function setStatus(kind, text, title) {
    els.dot.className = `dot ${kind}`;
    els.statusText.textContent = text;
    els.status.title = title;
  }

  async function checkHealth() {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/health`, {}, HEALTH_TIMEOUT_MS);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const h = await res.json();
      if (!h.ollama) {
        setStatus('warn', 'Ollama belum jalan', 'Backend aktif, tapi Ollama tidak terdeteksi.');
      } else if (!h.model_ready) {
        setStatus('warn', 'Model belum diunduh', `Jalankan: ollama pull ${h.model}`);
      } else {
        setStatus('online', 'Online', `Model: ${h.model}`);
      }
    } catch {
      setStatus('offline', 'Backend offline', 'Jalankan backend: uvicorn main:app --port 8000');
    }
  }

  // ----- Event -----
  els.send.addEventListener('click', sendMessage);
  els.reset.addEventListener('click', resetChat);
  els.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      sendMessage();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkHealth();
  });

  renderAll();
  checkHealth();
  setInterval(checkHealth, HEALTH_INTERVAL_MS);
  els.input.focus();
});
