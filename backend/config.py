"""Konfigurasi backend, dibaca dari environment variable."""
import os

# Catatan: sengaja BUKAN "OLLAMA_HOST", karena nama itu dipakai Ollama sendiri
# dengan format berbeda (mis. "0.0.0.0:11434" tanpa http://).
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "deepseek-r1:1.5b")
REQUEST_TIMEOUT = float(os.getenv("REQUEST_TIMEOUT", "120"))
MAX_HISTORY_TURNS = int(os.getenv("MAX_HISTORY_TURNS", "10"))
MAX_SESSIONS = int(os.getenv("MAX_SESSIONS", "100"))

PERSONA = (
    "Namamu adalah Hikari. Kamu adalah teman/asisten AI anime berwujud kucing yang ramah, "
    "imut, dan selalu ceria. Jawablah dalam bahasa Indonesia dengan singkat, jelas, dan "
    "santai. Kamu boleh sesekali memakai 'meow~' atau emoji, tapi jangan berlebihan."
)
