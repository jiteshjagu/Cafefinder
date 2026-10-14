# BrewSpot — Cafe Review & Recommendation System

## Original problem
Search cafes, view menus, rate & review, find cafes by price / food type / rating. Add essential features for easy use & management.
User choices: React + FastAPI + MongoDB, JWT email/password auth, AI barista chat + AI review summary (Emergent LLM key, claude-sonnet-5-5), seeded cafes + admin CRUD, warm cozy coffee-house design, "blow my mind".

## Implemented (Jun 2026)
- JWT auth (Bearer + httpOnly cookies), brute-force lockout, admin/demo seeding
- 10 seeded cafes w/ menus, 28 reviews; search, filters (price, rating, food type, amenities, neighbourhood), sort
- Cafe detail: gallery, open-now status, stats strip, menu w/ categories + veg filter, rating breakdown + sub-ratings, reviews (one per user, edit/delete, helpful votes, sort)
- AI review summary (cached by review count), AI Barista "Bean" streaming chat with clickable cafe recommendation cards, persistent history
- Favorites + my reviews page, Compare up to 3 cafes, Surprise-me random cafe, share link
- Admin dashboard: stats, cafe CRUD incl. menu items, recent reviews
- Tested: backend 25/25, frontend all critical flows pass

## Backlog
- P1: Map view of cafes, photo uploads in reviews (object storage)
- P1: Owner replies to reviews, review moderation queue
- P2: Personalized "For you" feed from history/favourites, email notifications
