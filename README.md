# 🔧 Pipe Forge

> A resurrection of Yahoo Pipes - the visual data pipeline builder that was ahead of its time.

**Built for the [Kiroween Hackathon](https://kiro.devpost.com/) 🎃**

## 🎯 What is Pipe Forge?

Yahoo Pipes (2007-2015) was a revolutionary visual tool for aggregating, filtering, and transforming data from various sources. **Pipe Forge** brings it back with modern technology:

- 🎨 **Visual Editor** - Drag-and-drop pipeline builder with ReactFlow
- 🔗 **15+ Operators** - Fetch, Filter, Sort, Transform, and more
- 🌐 **Multiple Sources** - JSON APIs, RSS feeds, CSV files, web pages
- 🔒 **Secure** - Encrypted secrets, domain whitelist, rate limiting
- 👥 **Social** - Share, fork, like, and discover community pipes

## 🌐 Live Demo

| Service | URL |
|---------|-----|
| **Frontend** | https://pipeforge-480308-ab122.web.app |
| **Backend API** | https://pipeforge-api-1023389197722.us-central1.run.app |

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- Redis 7+ (or Memurai on Windows)

### 1. Clone & Setup

```bash
git clone <repository-url>
cd yahoo-resurect

# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run migrate
npm run db:seed  # Creates sample templates
npm run dev

# Frontend (new terminal)
cd ../frontend
npm install
cp .env.example .env
npm run dev
```

### 2. Open the App

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### 3. Test Credentials

```
Email: test@example.com
Password: TestPassword123!
```

## 📦 Sample Templates

Pipe Forge comes with 12 ready-to-use templates across 4 categories:

| Category | Templates |
|----------|-----------|
| 🚀 **Getting Started** | First Steps, Last Items, Rename Fields |
| ⚙️ **Data Processing** | Filter & Sort, Transform & Extract, Remove Duplicates |
| 🔌 **API Integration** | GitHub Top Repos, GitHub User Profile, Weather Dashboard, DEV.to Articles |
| 📡 **RSS & Feeds** | Tech News Feed, Reddit Feed Reader |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  React 19 + TypeScript + Redux Toolkit + ReactFlow + Tailwind │
├─────────────────────────────────────────────────────────────┤
│                          Backend                             │
│     Node.js + Express + TypeScript + PostgreSQL + Redis      │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Redux Toolkit, ReactFlow, Tailwind CSS |
| Backend | Node.js 20+, Express, TypeScript |
| Database | PostgreSQL 14+, Redis 7+ |
| Auth | JWT + Google OAuth |
| Queue | Bull (Redis-based job queue) |

## 🚀 Production Deployment

### Infrastructure Overview

| Component | Service | Details |
|-----------|---------|---------|
| Backend API | Cloud Run | Auto-scaling, containerized Node.js |
| Database | Cloud SQL | PostgreSQL 14 |
| Cache | Upstash Redis | Serverless Redis |
| Frontend | Firebase Hosting | Global CDN |
| CI/CD | GitHub Actions | Auto-deploy on push to main |

### CI/CD: Auto-Deploy on Push

This project uses **GitHub Actions** for automatic deployment. When you push to `main`:
1. Backend is built and deployed to Cloud Run
2. Frontend is built and deployed to Firebase Hosting

#### Required GitHub Secrets

Set these in your repo: **Settings → Secrets and variables → Actions**

| Secret | Description |
|--------|-------------|
| `GCP_SA_KEY` | GCP Service Account JSON key (with Cloud Run, Cloud Build, Storage permissions) |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase service account JSON for hosting deployment |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID for frontend |

#### Creating Service Accounts

```bash
# Create service account for CI/CD
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions"

# Grant permissions
gcloud projects add-iam-policy-binding pipeforge-480308 \
  --member="serviceAccount:github-actions@pipeforge-480308.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding pipeforge-480308 \
  --member="serviceAccount:github-actions@pipeforge-480308.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding pipeforge-480308 \
  --member="serviceAccount:github-actions@pipeforge-480308.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Create key and download
gcloud iam service-accounts keys create gcp-key.json \
  --iam-account=github-actions@pipeforge-480308.iam.gserviceaccount.com
```

### Manual Deployment

#### Deploy Backend to Cloud Run

```bash
cd backend

# Build and push image
docker build -t gcr.io/pipeforge-480308/pipeforge-api .
docker push gcr.io/pipeforge-480308/pipeforge-api

# Deploy
gcloud run deploy pipeforge-api \
  --image gcr.io/pipeforge-480308/pipeforge-api \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --add-cloudsql-instances pipeforge-480308:us-central1:pipeforge-db
```

#### Deploy Frontend to Firebase

```bash
cd frontend

# Set environment variables
export VITE_API_URL="https://pipeforge-api-1023389197722.us-central1.run.app/api/v1"
export VITE_GOOGLE_CLIENT_ID="your-google-client-id"

# Build and deploy
npm run build
cd ..
firebase deploy --only hosting
```

### Environment Variables (Cloud Run)

Configure these in Cloud Run Console or via `gcloud run services update`:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `8080` |
| `DATABASE_URL` | Cloud SQL connection | `postgresql://user:pass@/db?host=/cloudsql/project:region:instance` |
| `REDIS_URL` | Upstash Redis URL | `rediss://...` |
| `JWT_SECRET` | JWT signing key (64 hex chars) | `91fcc384...` |
| `SECRETS_ENCRYPTION_KEY` | AES encryption key (64 hex chars) | `6cc91e0f...` |
| `GOOGLE_CLIENT_ID` | OAuth client ID | `123...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret | `GOCSPX-...` |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL | `https://your-api.run.app/api/v1/auth/google/callback` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://your-app.web.app` |
| `CORS_ORIGINS` | Allowed origins | `https://your-app.web.app` |
| `STORAGE_PROVIDER` | Storage type | `disk` |

### Database Setup

#### Run Migrations

Connect via Cloud SQL Proxy or Cloud Shell:

```bash
gcloud sql connect pipeforge-db --user=postgres --database=pipes_prod
```

#### Seed Templates

Run this SQL in the database to add sample templates:

```sql
-- See backend/src/scripts/seed-db.ts for full seed SQL
-- Or connect locally via Cloud SQL Proxy and run:
-- npm run db:seed
```

### Google OAuth Setup

1. Go to [Google Cloud Console → APIs & Credentials](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID (Web application)
3. Add **Authorized JavaScript origins**:
   - `http://localhost:5173` (dev)
   - `https://pipeforge-480308-ab122.web.app` (prod)
4. Add **Authorized redirect URIs**:
   - `http://localhost:3000/api/v1/auth/google/callback` (dev)
   - `https://pipeforge-api-1023389197722.us-central1.run.app/api/v1/auth/google/callback` (prod)
5. Update Cloud Run environment variables with new Client ID/Secret

## 🎨 Features

### Visual Pipeline Editor
- Drag-and-drop operators from categorized palette
- Real-time schema propagation between nodes
- Inline configuration (no side panels!)
- Undo/Redo with keyboard shortcuts
- Zoom, pan, and fit-to-view controls

### Operators
- **Sources**: Fetch JSON, CSV, RSS, Web Page
- **Transforms**: Filter, Sort, Transform, Unique, Truncate, Tail, Rename
- **String**: Replace, Regex, Substring
- **URL**: URL Builder with dynamic parameters
- **User Input**: Text, Number, URL, Date inputs
- **Output**: Pipe Output node

### Security
- AES-256-GCM encrypted secrets storage
- Domain whitelist for external APIs
- Rate limiting on all endpoints
- Input validation and SQL injection prevention

### Social Features
- Browse and discover community pipes
- Fork any public pipe
- Like/unlike pipes
- Trending and featured sections

## 📁 Project Structure

```
pipe-forge/
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD pipeline
├── .kiro/                       # Kiro specs and steering docs
├── backend/                     # Node.js API
│   ├── src/
│   │   ├── config/             # Environment config
│   │   ├── operators/          # All operator implementations
│   │   ├── routes/             # API endpoints
│   │   ├── services/           # Business logic
│   │   └── scripts/            # DB migrations, seeds
│   ├── Dockerfile
│   └── package.json
├── frontend/                    # React app
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── pages/              # Route pages
│   │   ├── store/              # Redux slices
│   │   └── services/           # API clients
│   └── package.json
├── firebase.json                # Firebase config
└── README.md
```

## 🔧 Troubleshooting

### Cloud Run: Container failed to start

Check logs:
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=pipeforge-api" --limit=30
```

Common issues:
- Missing environment variables (check all required vars are set)
- PORT mismatch (must be 8080 for Cloud Run)
- Database connection failed (check Cloud SQL instance is connected)

### Google OAuth: redirect_uri_mismatch

1. Verify redirect URI in Google Console matches exactly
2. Include both `http://` and `https://` versions if needed
3. Wait 5 minutes after changes for propagation

### Database: Empty templates

Run the seed script or insert SQL directly via Cloud Shell.

## 🎃 Hackathon Category

**Resurrection** - Bringing Yahoo Pipes back to life with modern innovations.

### What Makes This a Resurrection?

1. **Faithful to the Original** - Visual data mashup with drag-and-drop
2. **Modern Technology** - React, TypeScript, PostgreSQL (not Flash!)
3. **New Capabilities** - Schema propagation, encrypted secrets, social features
4. **Solving Today's Problems** - API mashups, data transformation, automation

## 📝 License

MIT - See [LICENSE](./LICENSE) file

## 🙏 Acknowledgments

- Original Yahoo Pipes team (2007-2015)
- The Kiro team for an amazing IDE
- All developers who missed Yahoo Pipes
