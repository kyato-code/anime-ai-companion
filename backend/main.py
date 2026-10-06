"""Backend FastAPI untuk Anime AI Companion.

Jalankan (dari folder backend):
    uvicorn main:app --reload --host 127.0.0.1 --port 8000
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import agent
from config import MAX_HISTORY_TURNS, MAX_SESSIONS, OLLAMA_MODEL
from sessions import SessionStore

log = logging.getLogger("hikari")
sessions = SessionStore(max_sessions=MAX_SESSIONS, max_turns=MAX_HISTORY_TURNS)


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield
    await agent.close()


app = FastAPI(title="Anime AI Companion API", lifespan=lifespan)

# Hanya ekstensi Chrome dan localhost yang boleh memanggil API ini.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^(chrome-extension://[a-z]+|https?://(localhost|127\.0\.0\.1)(:\d+)?)$",
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type"],
)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    session_id: str = Field(default="default", min_length=1, max_length=64, pattern=r"^[\w-]+$")


class ChatResponse(BaseModel):
    reply: str


class HealthResponse(BaseModel):
    status: str
    model: str
    ollama: bool
    model_ready: bool


@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(status="ok", model=OLLAMA_MODEL, **await agent.check_ollama())


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    text = req.message.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Pesan tidak boleh kosong.")

    try:
        reply = await agent.ask(text, sessions.get(req.session_id))
    except Exception as exc:
        log.exception("Gagal memanggil model")
        if getattr(exc, "status_code", None) == 404:
            raise HTTPException(
                status_code=503,
                detail=f"Model belum diunduh. Jalankan: ollama pull {OLLAMA_MODEL}",
            ) from exc
        raise HTTPException(
            status_code=503,
            detail="Model AI tidak bisa dihubungi. Pastikan Ollama sedang berjalan.",
        ) from exc

    reply = reply or "Meow... aku bingung mau jawab apa~ Coba tanya dengan cara lain ya!"
    sessions.add_turn(req.session_id, text, reply)
    return ChatResponse(reply=reply)


@app.delete("/chat/{session_id}")
async def reset_chat(session_id: str):
    """Hapus riwayat obrolan satu sesi."""
    return {"cleared": sessions.clear(session_id)}
