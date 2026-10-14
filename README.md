# File System Wrapper — Backend API

Node.js + Express + MySQL backend for the File System Wrapper dashboard.

## Setup

```bash
cd backend
npm install
# Copy and edit env
cp .env.example .env
# Update DB credentials in .env
npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/domains` | List all domains |
| GET | `/api/mailboxes?domain_id=1` | List mailboxes by domain |
| GET | `/api/files` | List files (with filters) |
| GET | `/api/files/:id` | Get file metadata |
| GET | `/api/files/:id/view` | Stream file (PDF viewer) |
| POST | `/api/files/:id/upload` | Mark file as uploaded |

## File Query Parameters

- `domain_id` — Filter by domain
- `mailbox_id` — Filter by mailbox
- `downloaded_year_month` — Format: `2026-01`
- `uploaded_year_month` — Format: `2026-01`
- `page` — Page number (default: 1)
- `limit` — Items per page (default: 20)

## Architecture

```
src/
├── configs/          # App config (env, DB)
├── infrastructure/   # DB connection pool
├── repositories/     # Raw SQL / data access
├── services/         # Business logic
├── controllers/      # HTTP handlers
├── routes/           # Route definitions
├── middlewares/      # Error handling, validation
└── utils/            # Response helpers
```
