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


class AlertRepository:
    """Gerencia alert_configs e alert_dispatches no banco de dados."""

    # --- Alert Configs ---

    def create_config(self, user_id: int, ticker: str, alert_type: str,
                      threshold_value: float = None, sentiment_keywords: str = None,
                      cooldown_hours: int = 4) -> dict:
        conn = get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """INSERT INTO alert_configs
                   (user_id, ticker, alert_type, threshold_value, sentiment_keywords, cooldown_hours)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (user_id, ticker.upper(), alert_type, threshold_value, sentiment_keywords, cooldown_hours)
            )
            conn.commit()
            row = conn.execute("SELECT * FROM alert_configs WHERE id = ?", (cursor.lastrowid,)).fetchone()
            return dict(row)
        finally:
            conn.close()

    def get_by_user(self, user_id: int) -> List[dict]:
        conn = get_connection()
        rows = conn.execute(
            "SELECT * FROM alert_configs WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,)
        ).fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def get_active_price_configs(self, ticker: str) -> List[dict]:
        """Retorna todos os alertas de preço ativos para um determinado ticker."""
        conn = get_connection()
        rows = conn.execute(
            """SELECT * FROM alert_configs
               WHERE ticker = ? AND is_active = 1
               AND alert_type IN ('PRICE_BELOW', 'PRICE_ABOVE')""",
            (ticker.upper(),)
        ).fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def get_distinct_monitored_tickers(self) -> List[str]:
        """Retorna lista única de tickers com alertas ativos."""
        conn = get_connection()
        rows = conn.execute(
            "SELECT DISTINCT ticker FROM alert_configs WHERE is_active = 1"
        ).fetchall()
        conn.close()
        return [r["ticker"] for r in rows]

    def deactivate_config(self, config_id: int, user_id: int) -> bool:
        conn = get_connection()
        cursor = conn.execute(
            "UPDATE alert_configs SET is_active = 0 WHERE id = ? AND user_id = ?",
            (config_id, user_id)
        )
        conn.commit()
        conn.close()
        return cursor.rowcount > 0

    # --- Alert Dispatches ---

    def is_in_cooldown(self, config_id: int) -> bool:
        """Verifica se o alerta ainda está dentro do período de cooldown (idempotência)."""
        conn = get_connection()
        row = conn.execute(
            """SELECT id FROM alert_dispatches
               WHERE alert_config_id = ?
               AND cooldown_until > datetime('now')
               AND status IN ('PENDING', 'PROCESSING', 'DELIVERED')
               ORDER BY triggered_at DESC LIMIT 1""",
            (config_id,)
        ).fetchone()
        conn.close()
        return row is not None

    def create_dispatch(self, config_id: int, user_id: int, ticker: str,
                        trigger_price: float, cooldown_hours: int = 4) -> int:
        from datetime import datetime, timedelta, timezone
        cooldown_until = (datetime.now(timezone.utc) + timedelta(hours=cooldown_hours)).strftime("%Y-%m-%d %H:%M:%S")
        conn = get_connection()
        cursor = conn.execute(
            """INSERT INTO alert_dispatches
               (alert_config_id, user_id, ticker, trigger_price, cooldown_until, status)
               VALUES (?, ?, ?, ?, ?, 'PENDING')""",
            (config_id, user_id, ticker.upper(), trigger_price, cooldown_until)
        )
        conn.commit()
        dispatch_id = cursor.lastrowid
        conn.close()
        return dispatch_id

    def get_pending_dispatches(self, limit: int = 5) -> List[dict]:
        conn = get_connection()
        rows = conn.execute(
            """SELECT d.*, c.alert_type, c.threshold_value, c.cooldown_hours
               FROM alert_dispatches d
               JOIN alert_configs c ON c.id = d.alert_config_id
               WHERE d.status = 'PENDING'
               ORDER BY d.triggered_at ASC
               LIMIT ?""",
            (limit,)
        ).fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def update_dispatch_status(self, dispatch_id: int, status: str, error: str = None):
        conn = get_connection()
        conn.execute(
            "UPDATE alert_dispatches SET status = ?, error_message = ? WHERE id = ?",
            (status, error, dispatch_id)
        )
        conn.commit()
        conn.close()

    def update_dispatch_delivered(self, dispatch_id: int, analysis_payload: str):
        conn = get_connection()
        conn.execute(
            "UPDATE alert_dispatches SET status = 'DELIVERED', analysis_payload = ? WHERE id = ?",
            (analysis_payload, dispatch_id)
        )
        conn.commit()
        conn.close()

    def get_history_by_user(self, user_id: int, limit: int = 20) -> List[dict]:
        conn = get_connection()
        rows = conn.execute(
            """SELECT d.*, c.alert_type, c.threshold_value
               FROM alert_dispatches d
               JOIN alert_configs c ON c.id = d.alert_config_id
               WHERE d.user_id = ? AND d.status = 'DELIVERED'
               ORDER BY d.triggered_at DESC LIMIT ?""",
            (user_id, limit)
        ).fetchall()
        conn.close()
        return [dict(r) for r in rows]

    # --- Price Cache ---

    def upsert_price(self, ticker: str, current_price: float, previous_close: float = None):
        conn = get_connection()
        conn.execute(
            """INSERT INTO price_cache (ticker, current_price, previous_close, last_updated)
               VALUES (?, ?, ?, datetime('now'))
               ON CONFLICT(ticker) DO UPDATE SET
                   current_price = excluded.current_price,
                   previous_close = excluded.previous_close,
                   last_updated = excluded.last_updated""",
            (ticker.upper(), current_price, previous_close)
        )
        conn.commit()
        conn.close()


alert_repo = AlertRepository()
