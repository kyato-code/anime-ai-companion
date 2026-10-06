# Anime AI Companion (college-ai-bot)

Ekstensi Chrome berisi teman AI bernama **Hikari**, kucing anime yang matanya mengikuti kursor.
Popup mengirim pesan ke backend FastAPI, lalu diteruskan ke model lokal lewat [Ollama](https://ollama.com).
Semuanya berjalan di komputer sendiri, tanpa API key.

## Fitur
- Obrolan dengan memori (Hikari ingat 10 tanya-jawab terakhir per sesi)
- Riwayat obrolan tetap ada saat popup ditutup lalu dibuka lagi
- Lampu status: backend / Ollama / model sudah siap atau belum
- Animasi avatar: mata mengikuti kursor, pipi merah dan mulut bergerak saat Hikari "bicara"
- Tombol ↺ untuk mulai obrolan baru

## Struktur
```
college-ai-bot/
├── backend/                 FastAPI + pydantic-ai
│   ├── main.py              endpoint /chat, /health
│   ├── agent.py             koneksi ke Ollama
│   ├── config.py            pengaturan (env var) dan persona Hikari
│   ├── sessions.py          memori obrolan per sesi
│   ├── text_utils.py        pembersih output model (<think>)
│   ├── tests/               unit test
│   ├── run.bat              jalankan backend di Windows
│   └── .env.example
├── extension/               ekstensi Chrome (Manifest V3)
└── extras/live2d-viewer/    prototipe Live2D (opsional, tidak dipakai)
```

## Menjalankan

### 1. Model
```bash
ollama pull deepseek-r1:1.5b
```

### 2. Backend
Windows: klik dua kali `backend/run.bat`. Atau manual:
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
Cek di browser: http://localhost:8000/health

### 3. Ekstensi
1. Buka `chrome://extensions` dan aktifkan **Developer mode**.
2. Klik **Load unpacked**, pilih folder `extension/`.
3. Klik ikon Hikari di toolbar.

Setelah mengubah file di `extension/`, klik tombol reload pada kartu ekstensi di `chrome://extensions`.

## Konfigurasi
Salin `backend/.env.example` menjadi `backend/.env`, lalu jalankan dengan
`uvicorn main:app --env-file .env`. Isinya: model, alamat Ollama, timeout, dan panjang memori.

## Test
```bash
cd backend
python -m unittest discover -s tests -t .
node --check ../extension/main.js
```

## Troubleshooting
| Gejala | Penyebab / solusi |
|---|---|
| Status "Backend offline" | Backend belum jalan. Jalankan langkah 2. |
| "Ollama belum jalan" | Buka aplikasi Ollama atau jalankan `ollama serve`. |
| "Model belum diunduh" | `ollama pull deepseek-r1:1.5b` |
| `pip install` gagal di Python 3.14 | Beberapa paket belum punya build untuk 3.14. Pakai Python 3.12 atau 3.13. |
| Jawaban lambat | Normal untuk model lokal di CPU. Naikkan `REQUEST_TIMEOUT` atau pakai model lebih kecil. |
| Jawaban kurang lancar berbahasa Indonesia | Model 1.5B terbatas. Coba `OLLAMA_MODEL=qwen2.5:3b`. |
