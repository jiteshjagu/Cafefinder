"""Tests for Photos-in-Reviews feature: /api/uploads, /api/files/{id}, review photos."""
import io
import os
import struct
import zlib

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://roast-rate-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = {"email": "admin@brewspot.app", "password": "admin123"}
DEMO = {"email": "demo@brewspot.app", "password": "demo123"}


def _png_bytes(w: int = 2, h: int = 2) -> bytes:
    """Minimal valid PNG."""
    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)
    raw = b""
    for _ in range(h):
        raw += b"\x00" + b"\xff\x00\x00" * w
    idat = zlib.compress(raw)
    return sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")


@pytest.fixture(scope="module")
def demo_token():
    r = requests.post(f"{API}/auth/login", json=DEMO)
    assert r.status_code == 200
    return r.json()["token"]


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json=ADMIN)
    assert r.status_code == 200
    return r.json()["token"]


def _auth(tok):
    return {"Authorization": f"Bearer {tok}"}


# ---------- Upload ----------
class TestUploads:
    def test_upload_requires_auth(self):
        r = requests.post(f"{API}/uploads", files={"file": ("a.png", _png_bytes(), "image/png")})
        assert r.status_code == 401

    def test_upload_png_ok(self, demo_token):
        r = requests.post(f"{API}/uploads", headers=_auth(demo_token),
                          files={"file": ("ok.png", _png_bytes(), "image/png")})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "id" in data and len(data["id"]) >= 10

    def test_upload_rejects_pdf(self, demo_token):
        r = requests.post(f"{API}/uploads", headers=_auth(demo_token),
                          files={"file": ("doc.pdf", b"%PDF-1.4 fake", "application/pdf")})
        assert r.status_code == 400

    def test_upload_rejects_text(self, demo_token):
        r = requests.post(f"{API}/uploads", headers=_auth(demo_token),
                          files={"file": ("a.txt", b"hello", "text/plain")})
        assert r.status_code == 400

    def test_upload_rejects_oversize(self, demo_token):
        big = b"\x00" * (8 * 1024 * 1024 + 100)
        r = requests.post(f"{API}/uploads", headers=_auth(demo_token),
                          files={"file": ("big.png", big, "image/png")})
        assert r.status_code == 400

    def test_get_file_public(self, demo_token):
        up = requests.post(f"{API}/uploads", headers=_auth(demo_token),
                           files={"file": ("x.png", _png_bytes(), "image/png")}).json()
        r = requests.get(f"{API}/files/{up['id']}")
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("image/")
        assert len(r.content) > 10

    def test_get_file_unknown_404(self):
        r = requests.get(f"{API}/files/does-not-exist-abc")
        assert r.status_code == 404


# ---------- Review photos ----------
class TestReviewPhotos:
    @pytest.fixture(scope="class")
    def cafe_id(self):
        r = requests.get(f"{API}/cafes")
        assert r.status_code == 200 and r.json()
        return r.json()[0]["id"]

    def _upload(self, tok):
        r = requests.post(f"{API}/uploads", headers=_auth(tok),
                          files={"file": ("p.png", _png_bytes(), "image/png")})
        assert r.status_code == 200, r.text
        return r.json()["id"]

    def test_create_review_with_photos(self, demo_token, cafe_id):
        p1, p2 = self._upload(demo_token), self._upload(demo_token)
        body = {"rating": 5, "coffee": 5, "ambience": 5, "service": 5, "value": 5,
                "visit_type": "Solo", "text": "TEST photos review ok " * 2, "photos": [p1, p2]}
        r = requests.post(f"{API}/cafes/{cafe_id}/reviews", json=body, headers=_auth(demo_token))
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["photos"] == [p1, p2]
        # verify via GET
        lst = requests.get(f"{API}/cafes/{cafe_id}/reviews").json()
        mine = next(x for x in lst if x["id"] == d["id"])
        assert set(mine["photos"]) == {p1, p2}

    def test_edit_review_updates_photos(self, demo_token, cafe_id):
        p3 = self._upload(demo_token)
        body = {"rating": 4, "coffee": 4, "ambience": 4, "service": 4, "value": 4,
                "visit_type": "Solo", "text": "TEST updated review photos ok", "photos": [p3]}
        r = requests.post(f"{API}/cafes/{cafe_id}/reviews", json=body, headers=_auth(demo_token))
        assert r.status_code == 200
        assert r.json()["photos"] == [p3]

    def test_rejects_photos_not_owned(self, demo_token, admin_token, cafe_id):
        admin_photo = self._upload(admin_token)
        body = {"rating": 5, "coffee": 5, "ambience": 5, "service": 5, "value": 5,
                "visit_type": "Solo", "text": "TEST should fail not owned", "photos": [admin_photo]}
        r = requests.post(f"{API}/cafes/{cafe_id}/reviews", json=body, headers=_auth(demo_token))
        assert r.status_code == 400

    def test_rejects_more_than_4_photos(self, demo_token, cafe_id):
        ids = [self._upload(demo_token) for _ in range(5)]
        body = {"rating": 5, "coffee": 5, "ambience": 5, "service": 5, "value": 5,
                "visit_type": "Solo", "text": "TEST too many photos", "photos": ids}
        r = requests.post(f"{API}/cafes/{cafe_id}/reviews", json=body, headers=_auth(demo_token))
        assert r.status_code in (400, 422)

    def test_cleanup_review(self, demo_token, cafe_id):
        # keep DB tidy — delete the demo review on this cafe
        lst = requests.get(f"{API}/cafes/{cafe_id}/reviews").json()
        me = requests.get(f"{API}/auth/me", headers=_auth(demo_token)).json()
        mine = [r for r in lst if r.get("user_id") == me["id"]]
        for r in mine:
            requests.delete(f"{API}/reviews/{r['id']}", headers=_auth(demo_token))
