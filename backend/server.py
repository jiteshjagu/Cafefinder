from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import re
import json
import uuid
import random
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from bson import ObjectId
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

from emergentintegrations.llm.chat import LlmChat, UserMessage
from auth_utils import (hash_password, verify_password, create_access_token, create_refresh_token,
                        decode, public_user, user_from_request)
from seed_data import CAFES, REVIEWERS, REVIEW_TEXTS

client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]
LLM_KEY = os.environ['EMERGENT_LLM_KEY']
LLM_MODEL = ("anthropic", "claude-sonnet-5-5")

app = FastAPI()
api = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

CAFE_PROJ = {"_id": 0}


def now_iso():
    return datetime.now(timezone.utc).isoformat()


# ---------- Models ----------
class RegisterIn(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    email: EmailStr
    password: str = Field(min_length=6)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class MenuItem(BaseModel):
    id: Optional[str] = None
    category: str
    name: str
    description: str = ""
    price: float
    veg: bool = True
    signature: bool = False


class CafeIn(BaseModel):
    name: str
    tagline: str = ""
    description: str = ""
    neighborhood: str = ""
    address: str = ""
    price_level: int = Field(ge=1, le=4)
    cuisines: List[str] = []
    amenities: List[str] = []
    vibes: List[str] = []
    wifi_speed: int = 0
    noise_level: str = "Moderate"
    open_time: str = "08:00"
    close_time: str = "20:00"
    images: List[str] = []
    menu: List[MenuItem] = []


class ReviewIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    coffee: int = Field(ge=1, le=5)
    ambience: int = Field(ge=1, le=5)
    service: int = Field(ge=1, le=5)
    value: int = Field(ge=1, le=5)
    visit_type: str = "Solo"
    text: str = Field(min_length=10, max_length=2000)


class ChatIn(BaseModel):
    session_id: str
    message: str = Field(min_length=1, max_length=1000)


# ---------- Helpers ----------
def build_cafe_doc(data: CafeIn, existing: Optional[dict] = None) -> dict:
    doc = data.model_dump()
    doc["menu"] = [{**it, "id": it.get("id") or str(uuid.uuid4())} for it in doc["menu"]]
    if existing:
        return doc
    doc.update({"id": str(uuid.uuid4()), "rating_avg": 0.0, "review_count": 0,
                "sub_ratings": {"coffee": 0, "ambience": 0, "service": 0, "value": 0},
                "rating_dist": {str(i): 0 for i in range(1, 6)}, "created_at": now_iso()})
    return doc


async def recompute_cafe(cafe_id: str):
    reviews = await db.reviews.find({"cafe_id": cafe_id}, {"_id": 0}).to_list(5000)
    n = len(reviews)
    avg = lambda k: round(sum(r[k] for r in reviews) / n, 1) if n else 0
    dist = {str(i): sum(1 for r in reviews if r["rating"] == i) for i in range(1, 6)}
    await db.cafes.update_one({"id": cafe_id}, {"$set": {
        "rating_avg": avg("rating"), "review_count": n, "rating_dist": dist,
        "sub_ratings": {k: avg(k) for k in ["coffee", "ambience", "service", "value"]}}})


async def require_admin(request: Request):
    user = await user_from_request(request, db)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user


def set_auth_cookies(response: Response, user_id: str, email: str) -> str:
    access = create_access_token(user_id, email)
    response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=43200, path="/")
    response.set_cookie("refresh_token", create_refresh_token(user_id), httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    return access


# ---------- Auth ----------
@api.post("/auth/register")
async def register(body: RegisterIn, response: Response):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    res = await db.users.insert_one({"email": email, "name": body.name, "password_hash": hash_password(body.password),
                                     "role": "user", "favorites": [], "created_at": now_iso()})
    token = set_auth_cookies(response, str(res.inserted_id), email)
    return {"user": {"id": str(res.inserted_id), "email": email, "name": body.name, "role": "user"}, "token": token}


@api.post("/auth/login")
async def login(body: LoginIn, request: Request, response: Response):
    email = body.email.lower()
    ident = f"{request.client.host if request.client else 'x'}:{email}"
    att = await db.login_attempts.find_one({"identifier": ident})
    if att and att.get("count", 0) >= 5 and att.get("locked_until", "") > now_iso():
        raise HTTPException(status_code=429, detail="Too many attempts. Try again in 15 minutes.")
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        count = (att or {}).get("count", 0) + 1
        locked = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat() if count >= 5 else ""
        await db.login_attempts.update_one({"identifier": ident}, {"$set": {"count": count, "locked_until": locked}}, upsert=True)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await db.login_attempts.delete_one({"identifier": ident})
    token = set_auth_cookies(response, str(user["_id"]), email)
    return {"user": public_user(user), "token": token}


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@api.get("/auth/me")
async def me(request: Request):
    return await user_from_request(request, db)


@api.post("/auth/refresh")
async def refresh(request: Request, response: Response):
    tok = request.cookies.get("refresh_token")
    if not tok:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = decode(tok)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    return {"token": set_auth_cookies(response, str(user["_id"]), user["email"])}


# ---------- Cafes ----------
@api.get("/cafes/meta")
async def cafes_meta():
    cafes = await db.cafes.find({}, {"_id": 0, "cuisines": 1, "amenities": 1, "neighborhood": 1, "vibes": 1}).to_list(1000)
    collect = lambda k: sorted({x for c in cafes for x in c.get(k, [])})
    return {"cuisines": collect("cuisines"), "amenities": collect("amenities"), "vibes": collect("vibes"),
            "neighborhoods": sorted({c["neighborhood"] for c in cafes if c.get("neighborhood")})}


@api.get("/cafes")
async def list_cafes(q: str = "", price: str = "", cuisine: str = "", amenity: str = "", neighborhood: str = "",
                     min_rating: float = 0, sort: str = "rating"):
    query = {}
    if q:
        rx = {"$regex": re.escape(q), "$options": "i"}
        query["$or"] = [{"name": rx}, {"tagline": rx}, {"description": rx}, {"neighborhood": rx},
                        {"cuisines": rx}, {"vibes": rx}, {"menu.name": rx}]
    if price:
        query["price_level"] = {"$in": [int(p) for p in price.split(",") if p]}
    if cuisine:
        query["cuisines"] = {"$all": [c for c in cuisine.split(",") if c]}
    if amenity:
        query["amenities"] = {"$all": [a for a in amenity.split(",") if a]}
    if neighborhood:
        query["neighborhood"] = neighborhood
    if min_rating:
        query["rating_avg"] = {"$gte": min_rating}
    sorts = {"rating": [("rating_avg", -1)], "reviews": [("review_count", -1)], "price_asc": [("price_level", 1)],
             "price_desc": [("price_level", -1)], "newest": [("created_at", -1)], "name": [("name", 1)]}
    return await db.cafes.find(query, {"_id": 0, "menu": 0}).sort(sorts.get(sort, sorts["rating"])).to_list(500)


@api.get("/cafes/random")
async def random_cafe():
    ids = await db.cafes.distinct("id")
    if not ids:
        raise HTTPException(status_code=404, detail="No cafes")
    return {"id": random.choice(ids)}


@api.get("/cafes/{cafe_id}")
async def get_cafe(cafe_id: str):
    cafe = await db.cafes.find_one({"id": cafe_id}, CAFE_PROJ)
    if not cafe:
        raise HTTPException(status_code=404, detail="Cafe not found")
    return cafe


@api.get("/stats")
async def stats():
    return {"cafes": await db.cafes.count_documents({}), "reviews": await db.reviews.count_documents({}),
            "users": await db.users.count_documents({}),
            "top": await db.cafes.find({}, {"_id": 0, "menu": 0}).sort("rating_avg", -1).limit(4).to_list(4)}


# ---------- Reviews ----------
@api.get("/cafes/{cafe_id}/reviews")
async def list_reviews(cafe_id: str, sort: str = "newest"):
    s = {"newest": [("created_at", -1)], "highest": [("rating", -1)], "lowest": [("rating", 1)],
         "helpful": [("helpful_count", -1)]}.get(sort, [("created_at", -1)])
    return await db.reviews.find({"cafe_id": cafe_id}, {"_id": 0, "helpful_by": 0}).sort(s).to_list(500)


@api.post("/cafes/{cafe_id}/reviews")
async def add_review(cafe_id: str, body: ReviewIn, request: Request):
    user = await user_from_request(request, db)
    if not await db.cafes.find_one({"id": cafe_id}):
        raise HTTPException(status_code=404, detail="Cafe not found")
    existing = await db.reviews.find_one({"cafe_id": cafe_id, "user_id": user["id"]})
    data = body.model_dump()
    if existing:
        await db.reviews.update_one({"id": existing["id"]}, {"$set": {**data, "updated_at": now_iso()}})
        rid = existing["id"]
    else:
        rid = str(uuid.uuid4())
        await db.reviews.insert_one({**data, "id": rid, "cafe_id": cafe_id, "user_id": user["id"], "user_name": user["name"],
                                     "helpful_count": 0, "helpful_by": [], "created_at": now_iso()})
    await recompute_cafe(cafe_id)
    return await db.reviews.find_one({"id": rid}, {"_id": 0, "helpful_by": 0})


@api.delete("/reviews/{review_id}")
async def delete_review(review_id: str, request: Request):
    user = await user_from_request(request, db)
    rev = await db.reviews.find_one({"id": review_id})
    if not rev:
        raise HTTPException(status_code=404, detail="Review not found")
    if rev["user_id"] != user["id"] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not allowed")
    await db.reviews.delete_one({"id": review_id})
    await recompute_cafe(rev["cafe_id"])
    return {"ok": True}


@api.post("/reviews/{review_id}/helpful")
async def helpful(review_id: str, request: Request):
    user = await user_from_request(request, db)
    rev = await db.reviews.find_one({"id": review_id})
    if not rev:
        raise HTTPException(status_code=404, detail="Review not found")
    if user["id"] in rev.get("helpful_by", []):
        await db.reviews.update_one({"id": review_id}, {"$pull": {"helpful_by": user["id"]}, "$inc": {"helpful_count": -1}})
        return {"helpful": False, "helpful_count": rev["helpful_count"] - 1}
    await db.reviews.update_one({"id": review_id}, {"$push": {"helpful_by": user["id"]}, "$inc": {"helpful_count": 1}})
    return {"helpful": True, "helpful_count": rev["helpful_count"] + 1}


@api.get("/me/reviews")
async def my_reviews(request: Request):
    user = await user_from_request(request, db)
    return await db.reviews.find({"user_id": user["id"]}, {"_id": 0, "helpful_by": 0}).sort("created_at", -1).to_list(500)


# ---------- AI Summary ----------
@api.get("/cafes/{cafe_id}/summary")
async def ai_summary(cafe_id: str):
    cafe = await db.cafes.find_one({"id": cafe_id}, CAFE_PROJ)
    if not cafe:
        raise HTTPException(status_code=404, detail="Cafe not found")
    cached = cafe.get("ai_summary")
    if cached and cached.get("review_count") == cafe["review_count"]:
        return cached
    reviews = await db.reviews.find({"cafe_id": cafe_id}, {"_id": 0}).sort("created_at", -1).to_list(40)
    if not reviews:
        return {"summary": "No reviews yet — be the first to share your experience!", "pros": [], "cons": [],
                "best_for": [], "review_count": 0}
    text = "\n".join(f"- {r['rating']}/5 ({r.get('visit_type','')}): {r['text']}" for r in reviews)
    chat = LlmChat(api_key=LLM_KEY, session_id=f"summary-{cafe_id}-{uuid.uuid4()}",
                   system_message="You summarise cafe reviews. Reply ONLY with compact JSON, no markdown.").with_model(*LLM_MODEL)
    prompt = (f"Cafe: {cafe['name']}. Reviews:\n{text}\n\nReturn JSON: {{\"summary\": \"2-3 warm sentences\", "
              f"\"pros\": [up to 3 short phrases], \"cons\": [up to 2 short phrases], \"best_for\": [up to 3 short tags]}}")
    try:
        raw = await chat.send_message(UserMessage(text=prompt))
        raw = raw if isinstance(raw, str) else str(raw)
        data = json.loads(raw[raw.find("{"): raw.rfind("}") + 1])
    except Exception as e:
        logger.error(f"summary failed: {e}")
        raise HTTPException(status_code=502, detail="AI summary unavailable right now")
    data["review_count"] = cafe["review_count"]
    await db.cafes.update_one({"id": cafe_id}, {"$set": {"ai_summary": data}})
    return data


# ---------- Reviews dashboard ----------
@api.get("/reviews")
async def all_reviews(rating: int = 0, cafe_id: str = "", limit: int = 100):
    q = {}
    if rating:
        q["rating"] = rating
    if cafe_id:
        q["cafe_id"] = cafe_id
    reviews = await db.reviews.find(q, {"_id": 0, "helpful_by": 0}).sort("created_at", -1).limit(min(limit, 500)).to_list(500)
    names = {c["id"]: c["name"] for c in await db.cafes.find({}, {"_id": 0, "id": 1, "name": 1}).to_list(1000)}
    for r in reviews:
        r["cafe_name"] = names.get(r["cafe_id"], "Unknown cafe")
    return reviews


@api.get("/reviews/dashboard")
async def reviews_dashboard():
    reviews = await db.reviews.find({}, {"_id": 0, "rating": 1, "coffee": 1, "ambience": 1, "service": 1, "value": 1,
                                         "created_at": 1, "user_id": 1}).to_list(10000)
    n = len(reviews)
    avg = lambda k: round(sum(r[k] for r in reviews) / n, 1) if n else 0
    since = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    today = datetime.now(timezone.utc).date()
    days = [(today - timedelta(days=i)) for i in range(29, -1, -1)]
    counts = {}
    for r in reviews:
        counts[r["created_at"][:10]] = counts.get(r["created_at"][:10], 0) + 1
    return {
        "total": n, "avg_rating": avg("rating"), "reviewers": len({r["user_id"] for r in reviews}),
        "last_30_days": sum(1 for r in reviews if r["created_at"] >= since),
        "distribution": {str(i): sum(1 for r in reviews if r["rating"] == i) for i in range(1, 6)},
        "aspects": {k: avg(k) for k in ["coffee", "ambience", "service", "value"]},
        "timeline": [{"date": d.strftime("%b %d"), "count": counts.get(d.isoformat(), 0)} for d in days],
        "leaderboard": await db.cafes.find({}, {"_id": 0, "id": 1, "name": 1, "images": 1, "rating_avg": 1, "review_count": 1})
        .sort([("rating_avg", -1), ("review_count", -1)]).to_list(100),
    }


# ---------- Favorites ----------
@api.get("/favorites")
async def get_favorites(request: Request):
    user = await user_from_request(request, db)
    doc = await db.users.find_one({"_id": ObjectId(user["id"])}, {"favorites": 1})
    ids = doc.get("favorites", [])
    cafes = await db.cafes.find({"id": {"$in": ids}}, {"_id": 0, "menu": 0}).to_list(500)
    return {"ids": ids, "cafes": cafes}


@api.post("/favorites/{cafe_id}")
async def toggle_favorite(cafe_id: str, request: Request):
    user = await user_from_request(request, db)
    doc = await db.users.find_one({"_id": ObjectId(user["id"])}, {"favorites": 1})
    favs = doc.get("favorites", [])
    if cafe_id in favs:
        await db.users.update_one({"_id": ObjectId(user["id"])}, {"$pull": {"favorites": cafe_id}})
        return {"saved": False}
    await db.users.update_one({"_id": ObjectId(user["id"])}, {"$addToSet": {"favorites": cafe_id}})
    return {"saved": True}


# ---------- Admin ----------
@api.get("/admin/stats")
async def admin_stats(request: Request):
    await require_admin(request)
    return {"cafes": await db.cafes.count_documents({}), "reviews": await db.reviews.count_documents({}),
            "users": await db.users.count_documents({}), "avg_rating": (await reviews_dashboard())["avg_rating"],
            "recent_reviews": await db.reviews.find({}, {"_id": 0, "helpful_by": 0}).sort("created_at", -1).limit(8).to_list(8)}


@api.post("/admin/cafes")
async def create_cafe(body: CafeIn, request: Request):
    await require_admin(request)
    doc = build_cafe_doc(body)
    await db.cafes.insert_one(doc)
    return await db.cafes.find_one({"id": doc["id"]}, CAFE_PROJ)


@api.put("/admin/cafes/{cafe_id}")
async def update_cafe(cafe_id: str, body: CafeIn, request: Request):
    await require_admin(request)
    existing = await db.cafes.find_one({"id": cafe_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Cafe not found")
    await db.cafes.update_one({"id": cafe_id}, {"$set": build_cafe_doc(body, existing)})
    return await db.cafes.find_one({"id": cafe_id}, CAFE_PROJ)


@api.delete("/admin/cafes/{cafe_id}")
async def delete_cafe(cafe_id: str, request: Request):
    await require_admin(request)
    await db.cafes.delete_one({"id": cafe_id})
    await db.reviews.delete_many({"cafe_id": cafe_id})
    return {"ok": True}


# ---------- Startup ----------
async def seed():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.cafes.create_index("id", unique=True)
    await db.reviews.create_index("cafe_id")
    admin_email, admin_pw = os.environ["ADMIN_EMAIL"].lower(), os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({"email": admin_email, "name": "Admin", "password_hash": hash_password(admin_pw),
                                   "role": "admin", "favorites": [], "created_at": now_iso()})
    elif not verify_password(admin_pw, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_pw)}})
    if not await db.users.find_one({"email": "demo@brewspot.app"}):
        await db.users.insert_one({"email": "demo@brewspot.app", "name": "Demo User", "password_hash": hash_password("demo123"),
                                   "role": "user", "favorites": [], "created_at": now_iso()})
    if await db.cafes.count_documents({}) > 0:
        return
    reviewer_ids = []
    for name, email in REVIEWERS:
        u = await db.users.find_one({"email": email})
        if not u:
            res = await db.users.insert_one({"email": email, "name": name, "password_hash": hash_password(uuid.uuid4().hex),
                                             "role": "user", "favorites": [], "created_at": now_iso()})
            reviewer_ids.append((str(res.inserted_id), name))
        else:
            reviewer_ids.append((str(u["_id"]), name))
    rng = random.Random(42)
    for i, raw in enumerate(CAFES):
        doc = build_cafe_doc(CafeIn(**raw))
        doc["created_at"] = (datetime.now(timezone.utc) - timedelta(days=60 - i * 5)).isoformat()
        await db.cafes.insert_one(doc)
        for j, (uid, uname) in enumerate(rng.sample(reviewer_ids, rng.randint(2, 4))):
            rating, text = REVIEW_TEXTS[(i + j) % len(REVIEW_TEXTS)]
            sub = lambda: max(1, min(5, rating + rng.choice([-1, 0, 0, 1])))
            await db.reviews.insert_one({
                "id": str(uuid.uuid4()), "cafe_id": doc["id"], "user_id": uid, "user_name": uname, "rating": rating,
                "coffee": sub(), "ambience": sub(), "service": sub(), "value": sub(),
                "visit_type": rng.choice(["Solo", "Date", "Friends", "Work", "Family"]), "text": text,
                "helpful_count": rng.randint(0, 12), "helpful_by": [],
                "created_at": (datetime.now(timezone.utc) - timedelta(days=rng.randint(1, 50))).isoformat()})
        await recompute_cafe(doc["id"])
    logger.info("Seeded cafes and reviews")


@app.on_event("startup")
async def on_startup():
    await seed()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


app.include_router(api)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=os.environ['CORS_ORIGINS'].split(','),
                   allow_methods=["*"], allow_headers=["*"])
