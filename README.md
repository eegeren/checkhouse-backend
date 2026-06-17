# CheckHouse Backend

Next.js API backend for CheckHouse property and neighborhood analysis.

## Setup

```bash
cp .env.example .env
npm install
npx prisma generate
npm run dev
```

Local PostgreSQL:

```bash
docker compose up -d
npx prisma migrate dev --name init
```

## Environment

```env
DATABASE_URL=
GEMINI_API_KEY=
JWT_SECRET=
```

If `GEMINI_API_KEY` is missing, CheckHouse returns mock AI summaries. Nominatim and Overpass do not require API keys.

## Routes

- `GET /api/health`
- `POST /api/auth/email-login`
- `GET /api/me`
- `POST /api/analyze`
- `POST /api/listing/parse`
- `POST /api/ai/summary`
- `GET /api/reports`
- `POST /api/reports`
- `DELETE /api/reports/:id`
- `POST /api/compare`

Authenticated requests use:

```http
Authorization: Bearer <token>
```

## Map and Location Data Policy

CheckHouse backend uses:

- Nominatim/OpenStreetMap for forward and reverse geocoding.
  Base URL: `https://nominatim.openstreetmap.org`
  User-Agent: `CheckHouse/1.0`
- OpenStreetMap Overpass API for nearby amenities and POI signals.
  Base URL: `https://overpass-api.de/api/interpreter`

Do not use Google Maps APIs in this backend.

Main flow:

1. User enters an address.
2. Backend geocodes with Nominatim.
3. Backend fetches nearby POIs with Overpass.
4. Backend calculates scores.
5. Backend generates AI summary with Gemini, or mock summary if `GEMINI_API_KEY` is missing.
6. Backend returns a complete CheckHouse report.
