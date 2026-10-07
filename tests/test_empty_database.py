"""Regression checks for installations without a committed SQLite database."""

import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from core.config import settings
from core.rate_limiter import limiter
from database.connection import get_connection, init_db
from database.repositories import alert_repo, chat_repo, favorite_repo, user_repo
from routers import auth, users


class EmptyDatabaseTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.db_path = Path(self.directory.name) / "fresh.sqlite3"
        patcher = patch.object(settings, "db_path", str(self.db_path))
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_initialization_creates_empty_schema_and_is_idempotent(self):
        self.assertFalse(self.db_path.exists())
        init_db()
        self.assertTrue(self.db_path.is_file())
        expected = {
            "users", "favorites", "chat_history", "alert_configs",
            "alert_dispatches", "price_cache",
        }
        with get_connection() as connection:
            tables = {
                row[0] for row in connection.execute(
                    "SELECT name FROM sqlite_master WHERE type='table' "
                    "AND name NOT LIKE 'sqlite_%'"
                )
            }
            self.assertEqual(tables, expected)
            for table in expected:
                self.assertEqual(
                    connection.execute(f"SELECT count(*) FROM {table}").fetchone()[0], 0
                )
        connection.close()
        user_id = user_repo.create("synthetic-user", "synthetic-not-a-password-hash")
        init_db()
        self.assertEqual(user_repo.get_by_id(user_id)["username"], "synthetic-user")

    def test_repositories_work_without_seeded_data(self):
        init_db()
        user_id = user_repo.create("synthetic-user", "synthetic-not-a-password-hash")
        self.assertEqual(favorite_repo.get_by_user(user_id), [])
        self.assertEqual(chat_repo.get_by_user(user_id), [])
        favorite_repo.add(user_id, "test3")
        self.assertEqual(favorite_repo.get_by_user(user_id)[0]["ticker"], "TEST3")
        chat_repo.append_message(user_id, "user", "Synthetic test message")
        self.assertEqual(chat_repo.get_by_user(user_id)[0]["content"], "Synthetic test message")
        config = alert_repo.create_config(user_id, "test3", "PRICE_BELOW", 10.0)
        dispatch = alert_repo.create_dispatch(config["id"], user_id, "test3", 9.0)
        self.assertTrue(alert_repo.is_in_cooldown(config["id"]))
        self.assertEqual(alert_repo.get_pending_dispatches()[0]["id"], dispatch)
        alert_repo.upsert_price("test3", 9.0, 10.0)
        self.assertEqual(alert_repo.get_distinct_monitored_tickers(), ["TEST3"])

    def test_registration_login_and_user_data_on_fresh_database(self):
        init_db()
        # Real routers, without the market/AI scheduler or external requests.
        app = FastAPI()
        app.state.limiter = limiter
        app.include_router(auth.router)
        app.include_router(users.router)
        with TestClient(app) as client:
            credentials = {"username": "synthetic-http-user", "password": "synthetic-test-only"}
            self.assertEqual(client.get("/api/me/favorites").status_code, 401)
            response = client.post("/api/auth/register", json=credentials)
            self.assertEqual(response.status_code, 200)
            headers = {"Authorization": "Bearer " + response.json()["access_token"]}
            self.assertEqual(client.get("/api/auth/me", headers=headers).status_code, 200)
            self.assertEqual(client.get("/api/me/chat/history", headers=headers).json(), {"history": []})
            self.assertEqual(client.post("/api/me/favorites/TEST3", headers=headers).status_code, 200)
            self.assertEqual(len(client.get("/api/me/favorites", headers=headers).json()["favorites"]), 1)
            self.assertEqual(client.post("/api/auth/login", data=credentials).status_code, 200)
            self.assertEqual(client.post("/api/auth/login", data={**credentials, "password": "wrong"}).status_code, 401)


if __name__ == "__main__":
    unittest.main()
