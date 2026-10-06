"""Fungsi teks murni (tanpa dependency berat) agar mudah di-test."""
import re

# deepseek-r1 menulis proses berpikirnya di <think>...</think>.
# Pola ini juga menangani tag yang tidak tertutup (jawaban terpotong).
_THINK_RE = re.compile(r"<think>.*?(?:</think>|\Z)", re.DOTALL | re.IGNORECASE)


def clean_reply(text: str | None) -> str:
    """Buang blok <think> dan rapikan spasi."""
    return _THINK_RE.sub("", text or "").strip()
