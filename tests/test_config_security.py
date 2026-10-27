import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


class SecretConfigurationTests(unittest.TestCase):
    def configured_process(self, secret):
        env = os.environ.copy()
        for name in list(env):
            if name.casefold() == 'secret_key':
                del env[name]
        env['PYTHONPATH'] = str(Path(__file__).resolve().parents[1])
        env['PYTHONDONTWRITEBYTECODE'] = '1'
        if secret is not None:
            env['SECRET_KEY'] = secret
        with tempfile.TemporaryDirectory() as directory:
            return subprocess.run([sys.executable, '-c', 'import core.config'],
                                  env=env, cwd=directory, capture_output=True).returncode

    def test_missing_short_blank_and_legacy_secrets_are_rejected(self):
        for secret in [None, '', 'short', ' ' * 64, 'radar-b3-secret-key-2024-mude-em-producao']:
            with self.subTest(kind='missing' if secret is None else 'invalid'):
                self.assertNotEqual(self.configured_process(secret), 0)

    def test_explicit_test_secret_is_accepted(self):
        self.assertEqual(self.configured_process('synthetic-test-only-secret-key-not-for-deployment'), 0)
