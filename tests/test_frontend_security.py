import tempfile
import unittest
from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient

from core.frontend import mount_frontend


class FrontendBoundaryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.parent = Path(self.temp.name)
        self.root = self.parent / 'dist'
        (self.root / 'assets').mkdir(parents=True)
        (self.root / 'index.html').write_text('synthetic-spa')
        (self.root / 'assets' / 'app.js').write_text('synthetic-asset')
        (self.parent / 'private.txt').write_text('outside-build-sentinel')
        app = FastAPI()
        self.assertTrue(mount_frontend(app, self.root))
        self.client = TestClient(app)
        self.addCleanup(self.client.close)

    def test_legitimate_files_and_spa_routes(self):
        self.assertEqual(self.client.get('/').text, 'synthetic-spa')
        self.assertEqual(self.client.get('/dashboard/favorites').text, 'synthetic-spa')
        self.assertEqual(self.client.get('/assets/app.js').text, 'synthetic-asset')

    def test_encoded_traversal_and_windows_paths_are_rejected(self):
        for path in ['/%2e%2e/private.txt', '/assets/%2e%2e/%2e%2e/private.txt', '/..%5cprivate.txt', '/%00private.txt']:
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 404)
                self.assertNotIn('outside-build-sentinel', response.text)

    def test_unknown_api_and_missing_asset_are_not_html_fallbacks(self):
        for path in ['/api', '/api/unknown', '/assets/missing.js']:
            self.assertEqual(self.client.get(path).status_code, 404)

    def test_file_and_directory_symlinks_cannot_leave_build(self):
        (self.root / 'leak.txt').symlink_to(self.parent / 'private.txt')
        (self.root / 'linked').symlink_to(self.parent, target_is_directory=True)
        for path in ['/leak.txt', '/linked/private.txt']:
            self.assertEqual(self.client.get(path).status_code, 404)

    def test_spa_index_symlink_cannot_leave_build(self):
        (self.root / 'index.html').unlink()
        (self.root / 'index.html').symlink_to(self.parent / 'private.txt')
        self.assertEqual(self.client.get('/dashboard').status_code, 404)

    def test_assets_root_symlink_cannot_leave_build(self):
        (self.root / 'assets' / 'app.js').unlink()
        (self.root / 'assets').rmdir()
        (self.root / 'assets').symlink_to(self.parent, target_is_directory=True)
        self.assertEqual(self.client.get('/assets/private.txt').status_code, 404)

    def test_missing_build_does_not_register_catchall(self):
        app = FastAPI()
        self.assertFalse(mount_frontend(app, self.parent / 'absent'))


if __name__ == '__main__':
    unittest.main()
