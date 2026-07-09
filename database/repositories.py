import sqlite3
from typing import List, Dict, Optional
from database.connection import get_connection

class UserRepository:
    def get_by_username(self, username: str) -> Optional[dict]:
        conn = get_connection()
        row = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        conn.close()
        return dict(row) if row else None

    def get_by_id(self, user_id: int) -> Optional[dict]:
        conn = get_connection()
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        conn.close()
        return dict(row) if row else None

    def create(self, username: str, hashed_password: str) -> int:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (username, hashed_password) VALUES (?, ?)",
            (username, hashed_password)
        )
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()
        return user_id

class FavoriteRepository:
    def get_by_user(self, user_id: int) -> List[dict]:
        conn = get_connection()
        rows = conn.execute(
            "SELECT ticker, created_at FROM favorites WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,)
        ).fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def add(self, user_id: int, ticker: str):
        conn = get_connection()
        try:
            conn.execute(
                "INSERT INTO favorites (user_id, ticker) VALUES (?, ?)",
                (user_id, ticker.upper())
            )
            conn.commit()
        except sqlite3.IntegrityError:
            pass
        finally:
            conn.close()

    def remove(self, user_id: int, ticker: str):
        conn = get_connection()
        conn.execute(
            "DELETE FROM favorites WHERE user_id = ? AND ticker = ?",
            (user_id, ticker.upper())
        )
        conn.commit()
        conn.close()

class ChatRepository:
    def get_by_user(self, user_id: int) -> List[dict]:
        conn = get_connection()
        rows = conn.execute(
            "SELECT role, content, created_at FROM chat_history WHERE user_id = ? ORDER BY id ASC",
            (user_id,)
        ).fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def append_message(self, user_id: int, role: str, content: str):
        conn = get_connection()
        conn.execute(
            "INSERT INTO chat_history (user_id, role, content) VALUES (?, ?, ?)",
            (user_id, role, content)
        )
        conn.commit()
        conn.close()

    def clear(self, user_id: int):
        conn = get_connection()
        conn.execute("DELETE FROM chat_history WHERE user_id = ?", (user_id,))
        conn.commit()
        conn.close()

user_repo = UserRepository()
favorite_repo = FavoriteRepository()
chat_repo = ChatRepository()
