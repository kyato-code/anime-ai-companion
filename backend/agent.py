"""Agent AI (persona Hikari) yang terhubung ke Ollama lokal."""
import httpx
from pydantic_ai import Agent
from pydantic_ai.messages import (
    ModelMessage,
    ModelRequest,
    ModelResponse,
    TextPart,
    UserPromptPart,
)
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider

from config import OLLAMA_MODEL, OLLAMA_URL, PERSONA, REQUEST_TIMEOUT
from sessions import Turn
from text_utils import clean_reply

# Satu HTTP client dipakai bersama; timeout panjang karena model lokal bisa lambat.
_http = httpx.AsyncClient(timeout=httpx.Timeout(REQUEST_TIMEOUT, connect=5.0))

_provider = OpenAIProvider(base_url=f"{OLLAMA_URL}/v1", api_key="ollama", http_client=_http)
_model = OpenAIChatModel(OLLAMA_MODEL, provider=_provider)

# `instructions` selalu disertakan di setiap panggilan, termasuk saat ada riwayat.
anime_agent = Agent(model=_model, instructions=PERSONA)


def _to_messages(turns: list[Turn]) -> list[ModelMessage]:
    """Ubah riwayat (sudah bersih dari <think>) menjadi pesan pydantic-ai."""
    messages: list[ModelMessage] = []
    for user, bot in turns:
        messages.append(ModelRequest(parts=[UserPromptPart(content=user)]))
        messages.append(ModelResponse(parts=[TextPart(content=bot)]))
    return messages


async def ask(message: str, history: list[Turn]) -> str:
    """Kirim pesan ke model dan kembalikan balasan yang sudah dibersihkan."""
    result = await anime_agent.run(message, message_history=_to_messages(history))
    return clean_reply(result.output)


async def check_ollama() -> dict:
    """Cek apakah Ollama hidup dan model yang dipakai sudah di-pull."""
    try:
        res = await _http.get(f"{OLLAMA_URL}/api/tags", timeout=2.0)
        res.raise_for_status()
        names = {m.get("name") for m in res.json().get("models", [])}
    except Exception:
        return {"ollama": False, "model_ready": False}
    ready = OLLAMA_MODEL in names or f"{OLLAMA_MODEL}:latest" in names
    return {"ollama": True, "model_ready": ready}


async def close() -> None:
    await _http.aclose()
