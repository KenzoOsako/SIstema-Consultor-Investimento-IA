"""JWT configuration and key-boundary regression tests; no operational secrets."""

import os
import secrets
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi import HTTPException
from jose import jwt
from pydantic import SecretStr, ValidationError

with patch.dict(os.environ, {"SECRET_KEY": secrets.token_hex(32)}):
    from core.config import Settings, settings
    from core.security import create_access_token, get_current_user


class JwtConfigurationTests(unittest.TestCase):
    def setUp(self):
        environment = patch.dict(os.environ)
        environment.start()
        self.addCleanup(environment.stop)
        for name in list(os.environ):
            if name.casefold() == "secret_key":
                del os.environ[name]

    def test_missing_key_is_rejected(self):
        with self.assertRaises(ValidationError):
            Settings(_env_file=None)

    def test_known_weak_values_are_rejected_without_printing_input(self):
        invalid = [
            "", "   ", "too-small-test-value", "a" * 64, "abc123" * 12,
            "0123456789abcdef" * 4,
            "radar-b3-secret-key-2024-mude-em-producao",
            "RADAR-B3-SECRET-KEY-2024-MUDE-EM-PRODUCAO",
            "sua_secret_key_de_producao",
            "sua_chave_criptografica_de_32_bytes",
            "your-super-secret-key-with-at-least-32-characters",
            " " + secrets.token_hex(32),
            secrets.token_hex(32) + "\n",
        ]
        for value in invalid:
            with self.subTest(case=invalid.index(value)):
                with self.assertRaises(ValidationError) as caught:
                    Settings(secret_key=value, _env_file=None)
                if value.strip():
                    self.assertNotIn(value, str(caught.exception))

    def test_explicit_key_is_preserved_and_repr_is_masked(self):
        key = secrets.token_urlsafe(48)
        configured = Settings(secret_key=key, _env_file=None)
        self.assertEqual(configured.secret_key.get_secret_value(), key)
        self.assertNotIn(key, repr(configured))
        self.assertNotIn(key, configured.model_dump_json())

    def test_environment_key_is_required_and_validated(self):
        key = secrets.token_hex(32)
        os.environ["SECRET_KEY"] = key
        self.assertEqual(Settings(_env_file=None).secret_key.get_secret_value(), key)
        os.environ["SECRET_KEY"] = ""
        with self.assertRaises(ValidationError):
            Settings(_env_file=None)

    def test_dotenv_uses_same_boundary_and_environment_does_not_fall_back(self):
        with tempfile.TemporaryDirectory() as directory:
            env_file = Path(directory) / ".env"
            key = secrets.token_hex(32)
            env_file.write_text("SECRET_KEY=" + key + "\n", encoding="utf-8")
            self.assertEqual(Settings(_env_file=env_file).secret_key.get_secret_value(), key)
            os.environ["SECRET_KEY"] = ""
            with self.assertRaises(ValidationError):
                Settings(_env_file=env_file)
            del os.environ["SECRET_KEY"]
            env_file.write_text("SECRET_KEY=" + "a" * 64 + "\n", encoding="utf-8")
            with self.assertRaises(ValidationError):
                Settings(_env_file=env_file)

    def test_assignment_cannot_restore_an_unsafe_key(self):
        configured = Settings(secret_key=secrets.token_hex(32), _env_file=None)
        with self.assertRaises(ValidationError):
            configured.secret_key = "a" * 64

    def test_config_import_refuses_missing_or_invalid_key(self):
        source_root = str(Path(__file__).resolve().parents[1])
        with tempfile.TemporaryDirectory() as directory:
            environment = os.environ.copy()
            environment["PYTHONPATH"] = source_root + os.pathsep + environment.get("PYTHONPATH", "")
            for value in (None, "a" * 64, secrets.token_hex(32)):
                if value is None:
                    environment.pop("SECRET_KEY", None)
                else:
                    environment["SECRET_KEY"] = value
                result = subprocess.run(
                    [sys.executable, "-c", "import core.config"],
                    cwd=directory, env=environment, capture_output=True, text=True,
                    timeout=30,
                )
                if value is not None and len(set(value)) >= 8:
                    self.assertEqual(result.returncode, 0, result.stderr)
                else:
                    self.assertNotEqual(result.returncode, 0)
                    self.assertIn("ValidationError", result.stderr)
                    if value:
                        self.assertNotIn(value, result.stderr)

    def test_jwt_round_trip_rejects_old_default_and_rotated_key(self):
        key = secrets.token_hex(32)
        user = {"id": 7, "username": "synthetic"}
        with patch.object(settings, "secret_key", SecretStr(key)):
            with patch("core.security.user_repo.get_by_id", return_value=user):
                token = create_access_token({"sub": "7"})
                self.assertEqual(get_current_user(token), user)
                for invalid_key in (
                    "radar-b3-secret-key-2024-mude-em-producao",
                    secrets.token_hex(32),
                ):
                    forged = jwt.encode({"sub": "7"}, invalid_key, algorithm="HS256")
                    with self.assertRaises(HTTPException) as caught:
                        get_current_user(forged)
                    self.assertEqual(caught.exception.status_code, 401)


if __name__ == "__main__":
    unittest.main()
