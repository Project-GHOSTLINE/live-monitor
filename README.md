# Live Situation Monitor

Real-time Middle East news aggregation dashboard. Aggregates news from 12 reputable sources, auto-translates to English, and presents in a clean dashboard.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up database
npm run setup-db

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page.
Open [http://localhost:3000/monitor](http://localhost:3000/monitor) to see the live monitor.

## 📊 Features

- **12 Reputable Sources**: BBC, Reuters, Al Jazeera, UN, Times of Israel, Haaretz, and more
- **Auto-Translation**: DeepL/Google Translate integration
- **Smart Deduplication**: Detects similar headlines using Levenshtein distance
- **Auto-Tagging**: 12 categories (Security, Military, Politics, Diplomacy, etc.)
- **Entity Extraction**: Places and organizations
- **Real-Time Updates**: Infinite scroll with auto-refresh
- **Filters**: Search, time range, source type, reliability

## 🗂️ Project Structure

```
ww3/
├── app/
│   ├── api/           # API routes
│   │   ├── ingest/    # RSS ingestion endpoint
│   │   ├── items/     # Feed items endpoint
│   │   ├── sources/   # Sources list endpoint
│   │   └── stats/     # Stats endpoint
│   ├── monitor/       # Monitor dashboard page
│   ├── layout.tsx     # Root layout
│   └── page.tsx       # Landing page
├── components/
│   ├── monitor/       # Monitor UI components
│   └── providers/     # React Query provider
├── lib/
│   ├── db/            # Database client & migrations
│   ├── rss/           # RSS fetching & parsing
│   ├── processing/    # Dedup, translate, tagging
│   └── utils/         # Helpers & validation
├── types/             # TypeScript types
├── scripts/           # Setup & test scripts
└── data/              # SQLite database (auto-created)
```

## 🔧 Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Database
DATABASE_PATH=./data/monitor.db

# Translation (optional - falls back to original if not set)
DEEPL_API_KEY=your_key_here
GOOGLE_TRANSLATE_API_KEY=your_key_here

# API Security
CRON_SECRET=random_secure_string

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📡 API Endpoints

### POST /api/ingest
Trigger RSS feed ingestion. Requires `x-vercel-cron-secret` header.

```bash
curl -X POST http://localhost:3000/api/ingest \
  -H "authorization: Bearer YOUR_CRON_SECRET"
```

### GET /api/items
Get paginated feed items with filters.

```bash
curl "http://localhost:3000/api/items?offset=0&limit=20&time_range=24h"
```

Query params:
- `offset` (number): Pagination offset
- `limit` (number): Items per page (max 100)
- `search` (string): Full-text search
- `source_type` (string): Filter by source type
- `reliability` (number): Minimum reliability (1-5)
- `tags` (string): Filter by tag
- `time_range` (string): 1h | 6h | 24h | 7d | all

### GET /api/sources
List all configured sources with status.

### GET /api/stats
Dashboard statistics.

## 📚 RSS Sources

12 curated sources organized by type:

**Mainstream (Reliability: 5)**
- BBC News - Middle East
- Reuters - World News
- AP News - Middle East

**Regional (Reliability: 4)**
- Al Jazeera - English
- Times of Israel
- Haaretz
- The Jerusalem Post
- Middle East Eye

**Humanitarian (Reliability: 5)**
- ReliefWeb - Updates
- UN OCHA - News

**Official (Reliability: 5)**
- UN News - Middle East
- UN Security Council

## 🧪 Testing

```bash
# Test database setup
npm run setup-db

# Test RSS ingestion
npm run ingest
```

## 🚀 Deployment to Vercel

### 1. Set up Turso (SQLite for production)

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Create database
turso db create live-monitor

# Get connection URL
turso db show live-monitor --url

# Create auth token
turso db tokens create live-monitor
```

### 2. Configure Vercel

Add environment variables in Vercel dashboard:
- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `DEEPL_API_KEY` (optional)
- `CRON_SECRET`

### 3. Deploy

```bash
vercel deploy
```

### 4. Configure Domain

In Vercel project settings:
- Add domain: `middleeastlivefeed.com`
- Configure DNS: CNAME → cname.vercel-dns.com

### 5. Set up Cron Job

Create `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/ingest",
    "schedule": "*/5 * * * *"
  }]
}
```

## 🔍 How It Works

1. **Ingestion**: Every 5 minutes (via cron), fetch RSS from 12 sources
2. **Parsing**: Normalize RSS/Atom to common schema
3. **Deduplication**: Check for URL matches or similar titles (Levenshtein > 0.75)
4. **Translation**: Auto-translate non-English content to English (DeepL → Google fallback)
5. **Tagging**: Extract 3-5 tags using keyword matching
6. **Entity Extraction**: Detect places (Gaza, Jerusalem, etc.) and organizations (UN, IDF, etc.)
7. **Storage**: Save to SQLite with all metadata
8. **Serving**: API routes serve paginated, filtered data
9. **UI**: React Query + infinite scroll for real-time updates

## 📖 Documentation

- **Deduplication**: Uses Levenshtein distance with 0.75 similarity threshold
- **Translation**: Cached in database to avoid redundant API calls
- **Rate Limiting**: Per-source throttling (5-30 minutes)
- **Caching**: API responses cached for 30 seconds
- **Performance**: Virtualized lists for 1000+ items

## 🔒 Security

- ✅ Parameterized SQL queries (no injection)
- ✅ API route authentication
- ✅ Input validation with Zod
- ✅ HTML sanitization
- ✅ Rate limiting

## 📝 License

MIT

---

**Live at**: https://middleeastlivefeed.com

**Note**: This aggregates public news sources. Always verify with original sources.
