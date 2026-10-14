"""Backend API tests - auth, cafes, reviews, reviews dashboard, favorites, admin, AI summary.
Barista & compare endpoints are removed; those tests dropped."""
import os
import uuid
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
        assert r.json()["user"]["email"] == DEMO["email"]

    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"email": "nope@x.com", "password": "wrong"})
        assert r.status_code == 401

    def test_me_requires_auth(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401


# ----- Cafes -----
class TestCafes:
    def test_list_cafes(self):
        r = requests.get(f"{API}/cafes")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) >= 1
        assert "id" in data[0] and "_id" not in data[0]

    def test_meta(self):
        r = requests.get(f"{API}/cafes/meta")
        assert r.status_code == 200
        m = r.json()
        for k in ["cuisines", "amenities", "vibes", "neighborhoods"]:
            assert k in m

    def test_stats(self):
        r = requests.get(f"{API}/stats")
        assert r.status_code == 200
        d = r.json()
        assert d["cafes"] > 0 and len(d["top"]) <= 4

    def test_get_cafe(self):
        cafes = requests.get(f"{API}/cafes").json()
        cid = cafes[0]["id"]
        r = requests.get(f"{API}/cafes/{cid}")
        assert r.status_code == 200
        assert r.json()["id"] == cid


# ----- Removed features (regression) -----
class TestRemovedFeatures:
    def test_barista_removed(self):
        """POST /api/barista/chat and GET history must be gone."""
        r = requests.post(f"{API}/barista/chat", json={"session_id": "x", "message": "hi"})
        assert r.status_code in (404, 405), f"Barista endpoint still exists: {r.status_code}"

    def test_compare_removed(self):
        r = requests.get(f"{API}/compare", params={"ids": "a,b"})
        assert r.status_code in (404, 405), f"Compare endpoint still exists: {r.status_code}"


# ----- Reviews dashboard (new) -----
class TestReviewsDashboard:
    def test_dashboard(self):
        r = requests.get(f"{API}/reviews/dashboard")
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ["total", "avg_rating", "reviewers", "last_30_days", "distribution", "aspects", "timeline", "leaderboard"]:
            assert k in d, f"missing {k}"
        # distribution has 1..5
        assert set(d["distribution"].keys()) == {"1", "2", "3", "4", "5"}
        # timeline is 30 days
        assert len(d["timeline"]) == 30
        # leaderboard entries projection
        if d["leaderboard"]:
            assert "_id" not in d["leaderboard"][0]
            assert "id" in d["leaderboard"][0] and "name" in d["leaderboard"][0]
        # aspects include coffee, ambience, service, value
        assert set(d["aspects"].keys()) == {"coffee", "ambience", "service", "value"}

    def test_all_reviews_endpoint(self):
        r = requests.get(f"{API}/reviews")
        assert r.status_code == 200
        reviews = r.json()
        assert isinstance(reviews, list)
        if reviews:
            assert "cafe_name" in reviews[0]
            assert "_id" not in reviews[0]
            assert "helpful_by" not in reviews[0]

    def test_all_reviews_filter_rating(self):
        r = requests.get(f"{API}/reviews", params={"rating": 5})
        assert r.status_code == 200
        for rev in r.json():
            assert rev["rating"] == 5

    def test_all_reviews_filter_cafe(self):
        cafes = requests.get(f"{API}/cafes").json()
        cid = next((c["id"] for c in cafes if c["review_count"] > 0), cafes[0]["id"])
        r = requests.get(f"{API}/reviews", params={"cafe_id": cid})
        assert r.status_code == 200
        for rev in r.json():
            assert rev["cafe_id"] == cid


# ----- Reviews & Favorites regression -----
class TestReviewsFavorites:
    def test_review_crud(self, demo_token):
        cafes = requests.get(f"{API}/cafes").json()
        cid = cafes[0]["id"]
        payload = {"rating": 5, "coffee": 5, "ambience": 4, "service": 5, "value": 4,
                   "visit_type": "Solo", "text": "TEST excellent spot for working remotely."}
        r = requests.post(f"{API}/cafes/{cid}/reviews", json=payload, headers=_auth(demo_token))
        assert r.status_code == 200
        rev = r.json()
        d = requests.delete(f"{API}/reviews/{rev['id']}", headers=_auth(demo_token))
        assert d.status_code == 200

    def test_favorites_toggle(self, demo_token):
        cafes = requests.get(f"{API}/cafes").json()
        cid = cafes[0]["id"]
        r = requests.post(f"{API}/favorites/{cid}", headers=_auth(demo_token))
        assert r.status_code == 200
        state = r.json()["saved"]
        r2 = requests.post(f"{API}/favorites/{cid}", headers=_auth(demo_token))
        assert r2.json()["saved"] != state


# ----- Admin -----
class TestAdmin:
    def test_admin_stats_includes_avg_rating(self, admin_token):
        r = requests.get(f"{API}/admin/stats", headers=_auth(admin_token))
        assert r.status_code == 200
        d = r.json()
        assert "cafes" in d and "reviews" in d and "users" in d
        assert "avg_rating" in d, "admin stats must expose avg_rating (replaces ai_chats)"
        assert "ai_chats" not in d, "ai_chats should be removed from admin stats"

    def test_admin_requires_role(self, demo_token):
        r = requests.get(f"{API}/admin/stats", headers=_auth(demo_token))
        assert r.status_code == 403

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
        cid = c.json()["id"]
        payload["name"] += "_upd"
        u = requests.put(f"{API}/admin/cafes/{cid}", json=payload, headers=_auth(admin_token))
        assert u.status_code == 200
        d = requests.delete(f"{API}/admin/cafes/{cid}", headers=_auth(admin_token))
        assert d.status_code == 200
        g2 = requests.get(f"{API}/cafes/{cid}")
        assert g2.status_code == 404


# ----- AI Summary -----
class TestAISummary:
    def test_summary(self):
        cafes = requests.get(f"{API}/cafes").json()
        cid = next((c["id"] for c in cafes if c["review_count"] > 0), cafes[0]["id"])
        r = requests.get(f"{API}/cafes/{cid}/summary", timeout=60)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "summary" in d and "pros" in d and "cons" in d
