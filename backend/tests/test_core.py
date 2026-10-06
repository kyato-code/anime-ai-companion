import unittest

from sessions import SessionStore
from text_utils import clean_reply


class CleanReplyTests(unittest.TestCase):
    def test_removes_think_block(self):
        self.assertEqual(clean_reply("<think>hmm...\nmikir</think>\nHalo!"), "Halo!")

    def test_removes_unclosed_think(self):
        self.assertEqual(clean_reply("Halo<think>terpotong di sini"), "Halo")

    def test_plain_text_untouched(self):
        self.assertEqual(clean_reply("  Halo juga  "), "Halo juga")

    def test_none_and_empty(self):
        self.assertEqual(clean_reply(None), "")
        self.assertEqual(clean_reply("<think>cuma mikir</think>"), "")


class SessionStoreTests(unittest.TestCase):
    def test_empty_session(self):
        self.assertEqual(SessionStore().get("x"), [])

    def test_keeps_only_last_turns(self):
        store = SessionStore(max_turns=2)
        for i in range(5):
            store.add_turn("s", f"u{i}", f"b{i}")
        self.assertEqual(store.get("s"), [("u3", "b3"), ("u4", "b4")])

    def test_evicts_oldest_session(self):
        store = SessionStore(max_sessions=2)
        store.add_turn("a", "1", "1")
        store.add_turn("b", "2", "2")
        store.get("a")  # "a" dipakai lagi, jadi "b" yang paling lama
        store.add_turn("c", "3", "3")
        self.assertEqual(len(store), 2)
        self.assertEqual(store.get("b"), [])
        self.assertNotEqual(store.get("a"), [])

    def test_clear(self):
        store = SessionStore()
        store.add_turn("s", "u", "b")
        self.assertTrue(store.clear("s"))
        self.assertFalse(store.clear("s"))

    def test_get_returns_copy(self):
        store = SessionStore()
        store.add_turn("s", "u", "b")
        store.get("s").clear()
        self.assertEqual(len(store.get("s")), 1)


if __name__ == "__main__":
    unittest.main()
