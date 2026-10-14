import os
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from bson import ObjectId
from fastapi import HTTPException, Request

JWT_ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(hours=12), "type": "access"}
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)


def decode(token: str) -> dict:
    return jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])


def public_user(user: dict) -> dict:
    return {"id": str(user["_id"]), "email": user["email"], "name": user.get("name", ""), "role": user.get("role", "user")}


def extract_token(request: Request):
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    return request.cookies.get("access_token")


async def user_from_request(request: Request, db, required: bool = True):
    token = extract_token(request)
    if not token:
        if required:
            raise HTTPException(status_code=401, detail="Not authenticated")
        return None
    try:
        payload = decode(token)
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return public_user(user)
    except jwt.ExpiredSignatureError:
        if required:
            raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        if required:
            raise HTTPException(status_code=401, detail="Invalid token")
    return None
