"""Penyimpanan riwayat obrolan per sesi (in-memory)."""
from collections import OrderedDict

Turn = tuple[str, str]  # (pesan_user, balasan_bot)


class SessionStore:
    """Menyimpan N pasang tanya-jawab terakhir untuk maksimal M sesi.

    Sesi yang paling lama tidak dipakai akan dibuang lebih dulu,
    jadi memori tidak membengkak.
    """

    def __init__(self, max_sessions: int = 100, max_turns: int = 10) -> None:
        self._max_sessions = max(1, max_sessions)
        self._max_turns = max(1, max_turns)
        self._data: OrderedDict[str, list[Turn]] = OrderedDict()

    def get(self, session_id: str) -> list[Turn]:
        turns = self._data.get(session_id)
        if turns is None:
            return []
        self._data.move_to_end(session_id)
        return list(turns)

    def add_turn(self, session_id: str, user: str, bot: str) -> None:
        turns = self._data.setdefault(session_id, [])
        turns.append((user, bot))
        del turns[: -self._max_turns]
        self._data.move_to_end(session_id)
        while len(self._data) > self._max_sessions:
            self._data.popitem(last=False)

    def clear(self, session_id: str) -> bool:
        return self._data.pop(session_id, None) is not None

    def __len__(self) -> int:
        return len(self._data)
