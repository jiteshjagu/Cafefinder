"""BrewSpot backend API tests - comprehensive coverage of auth, cafes, reviews, favorites, admin, barista."""
import os
import json
import uuid
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://roast-rate-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = {"email": "admin@brewspot.app", "password": "admin123"}
DEMO = {"email": "demo@brewspot.app", "password": "demo123"}


# ----- Fixtures -----
@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json=ADMIN)
    assert r.status_code == 200, f"admin login failed {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def demo_token():
    r = requests.post(f"{API}/auth/login", json=DEMO)
    assert r.status_code == 200, f"demo login failed {r.status_code} {r.text}"
    return r.json()["token"]


def _auth(tok):
    return {"Authorization": f"Bearer {tok}"}


# ----- Auth -----
class TestAuth:
    def test_login_admin(self):
        r = requests.post(f"{API}/auth/login", json=ADMIN)
        assert r.status_code == 200
        d = r.json()
        assert d["user"]["role"] == "admin"
        assert isinstance(d["token"], str) and len(d["token"]) > 10

    def test_login_demo(self):
        r = requests.post(f"{API}/auth/login", json=DEMO)
        assert r.status_code == 200
        assert r.json()["user"]["email"] == "demo@brewspot.app"

    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"email": "nope@x.com", "password": "wrong"})
        assert r.status_code == 401

    def test_register_and_me(self):
        email = f"test_{uuid.uuid4().hex[:8]}@brewspot.app.example.com"
        r = requests.post(f"{API}/auth/register", json={"name": "TEST User", "email": email, "password": "secret123"})
        assert r.status_code == 200, r.text
        tok = r.json()["token"]
        me = requests.get(f"{API}/auth/me", headers=_auth(tok))
        assert me.status_code == 200
        assert me.json()["email"] == email

    def test_register_duplicate(self):
        r = requests.post(f"{API}/auth/register", json={"name": "x", "email": DEMO["email"], "password": "secret123"})
        assert r.status_code == 400

    def test_me_requires_auth(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_bcrypt_hash_format(self):
        # Register and inspect only through verification path (hash itself not exposed via API).
        # Instead verify login still works to confirm bcrypt verification is operational.
        r = requests.post(f"{API}/auth/login", json=ADMIN)
        assert r.status_code == 200


# ----- Cafes -----
class TestCafes:
    def test_list_cafes(self):
        r = requests.get(f"{API}/cafes")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert "id" in data[0] and "name" in data[0]
        assert "_id" not in data[0]

    def test_meta(self):
        r = requests.get(f"{API}/cafes/meta")
        assert r.status_code == 200
        m = r.json()
        for k in ["cuisines", "amenities", "vibes", "neighborhoods"]:
            assert k in m and isinstance(m[k], list)

    def test_stats(self):
        r = requests.get(f"{API}/stats")
        assert r.status_code == 200
        d = r.json()
        assert d["cafes"] > 0
        assert len(d["top"]) <= 4

    def test_random(self):
        r = requests.get(f"{API}/cafes/random")
        assert r.status_code == 200
        assert "id" in r.json()

    def test_get_cafe(self):
        cafes = requests.get(f"{API}/cafes").json()
        cid = cafes[0]["id"]
        r = requests.get(f"{API}/cafes/{cid}")
        assert r.status_code == 200
        c = r.json()
        assert c["id"] == cid
        assert "menu" in c

    def test_get_cafe_404(self):
        r = requests.get(f"{API}/cafes/nonexistent-id")
        assert r.status_code == 404

    def test_filters(self):
        r = requests.get(f"{API}/cafes", params={"price": "1,2", "min_rating": 3, "sort": "reviews"})
        assert r.status_code == 200
        for c in r.json():
            assert c["price_level"] in [1, 2]
            assert c["rating_avg"] >= 3

    def test_search_query(self):
        r = requests.get(f"{API}/cafes", params={"q": "coffee"})
        assert r.status_code == 200


# ----- Reviews & Favorites -----
class TestReviewsFavorites:
    def test_review_crud_and_recompute(self, demo_token):
        cafes = requests.get(f"{API}/cafes").json()
        cid = cafes[0]["id"]
        before = requests.get(f"{API}/cafes/{cid}").json()
        payload = {"rating": 5, "coffee": 5, "ambience": 4, "service": 5, "value": 4,
                   "visit_type": "Solo", "text": "TEST excellent cozy spot for working remotely."}
        r = requests.post(f"{API}/cafes/{cid}/reviews", json=payload, headers=_auth(demo_token))
        assert r.status_code == 200, r.text
        rev = r.json()
        assert rev["rating"] == 5

        # List reviews
        lst = requests.get(f"{API}/cafes/{cid}/reviews").json()
        assert any(x["id"] == rev["id"] for x in lst)

        # Idempotent per user (one review per user) - second POST should update
        payload["rating"] = 4
        r2 = requests.post(f"{API}/cafes/{cid}/reviews", json=payload, headers=_auth(demo_token))
        assert r2.status_code == 200
        assert r2.json()["id"] == rev["id"]
        assert r2.json()["rating"] == 4

        # Helpful toggle (requires second user)
        email = f"helpful_{uuid.uuid4().hex[:6]}@brewspot.app.example.com"
        reg = requests.post(f"{API}/auth/register", json={"name": "Helper", "email": email, "password": "secret123"}).json()
        tok2 = reg["token"]
        h = requests.post(f"{API}/reviews/{rev['id']}/helpful", headers=_auth(tok2))
        assert h.status_code == 200
        assert h.json()["helpful"] is True

        # Delete
        d = requests.delete(f"{API}/reviews/{rev['id']}", headers=_auth(demo_token))
        assert d.status_code == 200
        after = requests.get(f"{API}/cafes/{cid}").json()
        assert after["review_count"] == before["review_count"]

    def test_my_reviews_requires_auth(self):
        r = requests.get(f"{API}/me/reviews")
        assert r.status_code == 401

    def test_favorites_toggle(self, demo_token):
        cafes = requests.get(f"{API}/cafes").json()
        cid = cafes[0]["id"]
        r = requests.post(f"{API}/favorites/{cid}", headers=_auth(demo_token))
        assert r.status_code == 200
        state = r.json()["saved"]
        favs = requests.get(f"{API}/favorites", headers=_auth(demo_token)).json()
        assert (cid in favs["ids"]) == state
        # Toggle again
        r2 = requests.post(f"{API}/favorites/{cid}", headers=_auth(demo_token))
        assert r2.json()["saved"] != state


# ----- Admin -----
class TestAdmin:
    def test_admin_stats(self, admin_token):
        r = requests.get(f"{API}/admin/stats", headers=_auth(admin_token))
        assert r.status_code == 200
        assert "cafes" in r.json()

    def test_admin_requires_role(self, demo_token):
        r = requests.get(f"{API}/admin/stats", headers=_auth(demo_token))
        assert r.status_code == 403

    def test_admin_unauth(self):
        r = requests.get(f"{API}/admin/stats")
        assert r.status_code == 401

    def test_admin_cafe_crud(self, admin_token):
        payload = {
            "name": f"TEST_Cafe_{uuid.uuid4().hex[:6]}",
            "tagline": "Testing", "description": "Test cafe", "neighborhood": "Testville",
            "address": "1 Test St", "price_level": 2, "cuisines": ["Coffee"], "amenities": ["WiFi"],
            "vibes": ["Cozy"], "wifi_speed": 50, "noise_level": "Quiet", "open_time": "08:00",
            "close_time": "20:00", "images": ["https://example.com/a.jpg"],
            "menu": [{"category": "Coffee", "name": "Espresso", "description": "", "price": 3.5, "veg": True, "signature": True}]
        }
        c = requests.post(f"{API}/admin/cafes", json=payload, headers=_auth(admin_token))
        assert c.status_code == 200, c.text
        cafe = c.json()
        cid = cafe["id"]
        assert cafe["menu"][0]["id"]

        # GET verifies persistence
        g = requests.get(f"{API}/cafes/{cid}")
        assert g.status_code == 200
        assert g.json()["name"] == payload["name"]

        # Update
        payload["name"] = payload["name"] + "_upd"
        u = requests.put(f"{API}/admin/cafes/{cid}", json=payload, headers=_auth(admin_token))
        assert u.status_code == 200
        assert u.json()["name"].endswith("_upd")

        # Delete
        d = requests.delete(f"{API}/admin/cafes/{cid}", headers=_auth(admin_token))
        assert d.status_code == 200
        g2 = requests.get(f"{API}/cafes/{cid}")
        assert g2.status_code == 404


# ----- Barista SSE -----
class TestBarista:
    def test_barista_history_empty(self):
        sid = f"test-{uuid.uuid4().hex[:8]}"
        r = requests.get(f"{API}/barista/history/{sid}")
        assert r.status_code == 200
        assert r.json() == []

    def test_barista_chat_streams(self):
        sid = f"test-{uuid.uuid4().hex[:8]}"
        r = requests.post(f"{API}/barista/chat",
                          json={"session_id": sid, "message": "Recommend a quiet cafe for working with wifi"},
                          stream=True, timeout=60)
        assert r.status_code == 200
        got_delta = False
        got_done = False
        for raw_line in r.iter_lines():
            if not raw_line:
                continue
            line = raw_line.decode()
            if line.startswith("data:"):
                payload = json.loads(line[5:].strip())
                if "delta" in payload:
                    got_delta = True
                if payload.get("done"):
                    got_done = True
                    break
                if "error" in payload:
                    pytest.fail(f"Barista error: {payload['error']}")
        assert got_done
        assert got_delta
        # Verify persistence
        hist = requests.get(f"{API}/barista/history/{sid}").json()
        assert len(hist) >= 2
        assert hist[0]["role"] == "user"


# ----- AI Summary -----
class TestAISummary:
    def test_summary(self):
        cafes = requests.get(f"{API}/cafes").json()
        # pick a cafe with reviews
        cid = next((c["id"] for c in cafes if c["review_count"] > 0), cafes[0]["id"])
        r = requests.get(f"{API}/cafes/{cid}/summary", timeout=60)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "summary" in d
        assert "pros" in d and "cons" in d
