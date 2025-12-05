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
| Container Registry | Artifact Registry | Docker images |
| CI/CD | GitHub Actions | Auto-deploy on push to main |

---

## 🔄 CI/CD Setup (Complete Guide)

This project uses **GitHub Actions** for automatic deployment. When you push to `main`:
1. Backend is built as Docker image → pushed to Artifact Registry → deployed to Cloud Run
2. Frontend is built → deployed to Firebase Hosting

### Step 1: Create GCP Service Account

Run in **Google Cloud Shell**:

```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions"
```

### Step 2: Grant Required Permissions

The service account needs **ALL** of these roles:

```bash
# Cloud Run deployment
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

# Act as service account
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Artifact Registry (pull images)
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.reader"

# Artifact Registry (push images)
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

# Cloud Storage (for build artifacts)
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

# Cloud Build (for building images)
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.editor"

# Logging (for viewing build logs)
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/logging.viewer"

# Service Usage (for API checks)
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/serviceusage.serviceUsageConsumer"
```

### Step 3: Create Artifact Registry Repository

```bash
gcloud artifacts repositories create cloud-run-source-deploy \
  --repository-format=docker \
  --location=us-central1 \
  --description="Docker images for Cloud Run"
```

### Step 4: Download Service Account Key

```bash
gcloud iam service-accounts keys create gcp-key.json \
  --iam-account=github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com

# Display the key (copy this for GitHub secret)
cat gcp-key.json
```

### Step 5: Get Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com) → Your Project
2. ⚙️ Settings → **Service accounts** tab
3. Click **"Generate new private key"**
4. Download the JSON file

### Step 6: Create Google OAuth Credentials

1. Go to [Google Cloud Console → APIs & Credentials](https://console.cloud.google.com/apis/credentials)
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Application type: **Web application**
4. Add **Authorized JavaScript origins**:
   - `http://localhost:5173`
   - `https://YOUR_FIREBASE_APP.web.app`
5. Add **Authorized redirect URIs**:
   - `http://localhost:3000/api/v1/auth/google/callback`
   - `https://YOUR_CLOUD_RUN_URL/api/v1/auth/google/callback`

### Step 7: Add GitHub Secrets

Go to GitHub → Your Repo → **Settings** → **Secrets and variables** → **Actions**

Add these 3 secrets:

| Secret Name | Value |
|-------------|-------|
| `GCP_SA_KEY` | Entire JSON from `gcp-key.json` |
| `FIREBASE_SERVICE_ACCOUNT` | Entire JSON from Firebase Console |
| `GOOGLE_CLIENT_ID` | OAuth Client ID (e.g., `123...apps.googleusercontent.com`) |

### Step 8: Configure Cloud Run Environment Variables

Go to [Cloud Run Console](https://console.cloud.google.com/run) → Your Service → **Edit & Deploy** → **Variables & Secrets**

Add these environment variables:

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `production` |
| `PORT` | `8080` |
| `DATABASE_URL` | `postgresql://user:pass@/db?host=/cloudsql/project:region:instance` |
| `REDIS_URL` | Your Upstash Redis URL |
| `JWT_SECRET` | 64 hex character secret |
| `SECRETS_ENCRYPTION_KEY` | 64 hex character key |
| `GOOGLE_CLIENT_ID` | OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret |
| `GOOGLE_REDIRECT_URI` | `https://YOUR_CLOUD_RUN_URL/api/v1/auth/google/callback` |
| `FRONTEND_URL` | `https://YOUR_FIREBASE_APP.web.app` |
| `CORS_ORIGINS` | `https://YOUR_FIREBASE_APP.web.app` |
| `STORAGE_PROVIDER` | `disk` |

### Step 9: Push to Deploy!

```bash
git add .
git commit -m "your changes"
git push origin main
```

Watch the **Actions** tab - both jobs should turn green! ✅

---

## 📊 Complete Permissions Summary

| Role | Purpose |
|------|---------|
| `roles/run.admin` | Deploy containers to Cloud Run |
| `roles/iam.serviceAccountUser` | Act as the service account |
| `roles/artifactregistry.reader` | Pull Docker images |
| `roles/artifactregistry.writer` | Push Docker images |
| `roles/storage.admin` | Access Cloud Storage buckets |
| `roles/storage.objectAdmin` | Manage storage objects |
| `roles/cloudbuild.builds.editor` | Trigger Cloud Build |
| `roles/logging.viewer` | View build logs |
| `roles/serviceusage.serviceUsageConsumer` | Check API enablement |

---

## 🗄️ Database Setup

### Seed Production Database

Connect via Cloud Shell:

```bash
gcloud sql connect YOUR_DB_INSTANCE --user=postgres --database=YOUR_DB_NAME
```

Then run the seed SQL from `backend/src/scripts/seed-db.ts` or use:

```bash
# Via Cloud SQL Proxy locally
npm run db:seed
```

---

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
├── .firebaserc                  # Firebase project config
└── README.md
```

## 🔧 Troubleshooting

### CI/CD: Permission denied on Artifact Registry

Ensure these roles are granted to the service account:
- `roles/artifactregistry.reader`
- `roles/artifactregistry.writer`

### CI/CD: Cannot find @rollup/rollup-linux-x64-gnu

The workflow explicitly installs this package. If it fails, the workflow includes:
```yaml
npm install @rollup/rollup-linux-x64-gnu --save-optional
```

### Cloud Run: Container failed to start

1. Check logs: `gcloud logging read "resource.type=cloud_run_revision"`
2. Verify all environment variables are set in Cloud Run Console
3. Ensure PORT is set to `8080`

### Google OAuth: redirect_uri_mismatch

1. Verify redirect URI in Google Console matches exactly
2. Include the full path: `https://your-api.run.app/api/v1/auth/google/callback`
3. Wait 5 minutes for changes to propagate

### Database: Empty templates

Connect to Cloud SQL and run the seed SQL, or use Cloud SQL Proxy to run `npm run db:seed` locally.

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
