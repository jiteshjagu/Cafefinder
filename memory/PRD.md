# Café’ Reviews (formerly BrewSpot) — Cafe Review & Recommendation System

## Original problem
Search cafes, view menus, rate & review, find cafes by price / food type / rating. Add essential features for easy use & management.
User choices: React + FastAPI + MongoDB, JWT email/password auth, AI barista chat + AI review summary (Emergent LLM key, claude-sonnet-5-5), seeded cafes + admin CRUD, warm cozy coffee-house design, "blow my mind".

## Implemented (Jun 2026)
- JWT auth (Bearer + httpOnly cookies), brute-force lockout, admin/demo seeding
- 10 seeded cafes w/ menus, 28 reviews; search, filters (price, rating, food type, amenities, neighbourhood), sort
- Cafe detail: gallery, open-now status, stats strip, menu w/ categories + veg filter, rating breakdown + sub-ratings, reviews (one per user, edit/delete, helpful votes, sort)
- AI review summary (cached by review count)
- Favorites + my reviews page, Surprise-me random cafe, share link

## Iteration 2 (Jun 2026)
- Rebranded to "Café’ Reviews" stylish logo; removed Compare, AI chatbot, Date-night mood
- Reviews Dashboard (/reviews): KPIs, rating distribution, 30-day timeline, leaderboard, aspect averages, filterable feed
- QR reviews: per-cafe QR (detail + admin) linking to /cafe/:id?review=1 which auto-opens review form (login redirect w/ next); /scan page with camera + image upload scanner (html5-qrcode)
- Admin dashboard: stats, cafe CRUD incl. menu items, recent reviews
- Tested: backend 25/25, frontend all critical flows pass

## Backlog
- P1: Map view of cafes, photo uploads in reviews (object storage)
- P1: Owner replies to reviews, review moderation queue
- P2: Personalized "For you" feed from history/favourites, email notifications

## Iteration 3 (Jun 2026)
- Review photos: up to 4 images per review (camera capture on mobile), Emergent object storage via /api/uploads + /api/files/{id}; shown in review list w/ lightbox, "From the community" strip on cafe page, and dashboard feed
