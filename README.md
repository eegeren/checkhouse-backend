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
DATABASE_URL=postgresql://checkhouse:checkhouse@localhost:5432/checkhouse?schema=public
OPENAI_API_KEY=
GEMINI_API_KEY=
OVERPASS_API_URL=https://overpass-api.de/api/interpreter
REVENUECAT_API_KEY=
JWT_SECRET=replace-with-a-long-random-secret
FREE_DAILY_LIMIT=3
```

If `DATABASE_URL` or external provider keys are missing, the backend uses safe mock/fallback behavior for local demos.

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
