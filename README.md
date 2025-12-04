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

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- Redis 7+

### 1. Clone & Setup

```bash
git clone <repository-url>
cd yahoo-resurect

# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials (see .env.example for guidance)
npm run migrate
npm run db:seed  # Creates sample pipes
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

## 📦 Sample Pipelines

Pipe Forge comes with 7 ready-to-use sample pipelines:

| Difficulty | Name | Description |
|------------|------|-------------|
| 🟢 Simple | First 5 Posts | Fetch → Truncate → Output |
| 🟡 Medium | User 1 Posts Sorted | Fetch → Filter → Sort → Truncate → Output |
| 🟠 Hard | Transform & Dedupe | Fetch → Filter → Transform → Unique → Output |
| 🔴 Complex | RSS Feed Cleaner | Fetch RSS → String Replace → Truncate → Output |
| ⭐ | GitHub Top Repos | Fetch → Sort → Truncate → Transform → Output |
| 📝 | Last 3 Comments | Fetch → Tail → Output |
| 🏷️ | Rename Fields Demo | Fetch → Truncate → Rename → Output |

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
├── .kiro/                    # Kiro specs and steering docs
│   ├── specs/                # Feature specifications
│   │   ├── pipe-forge-launch/    # Hackathon launch spec
│   │   ├── editor-bugfixes/      # Editor improvements
│   │   └── ...
│   └── steering/             # Architecture principles
├── backend/                  # Node.js API
│   ├── src/
│   │   ├── operators/        # All operator implementations
│   │   ├── routes/           # API endpoints
│   │   ├── services/         # Business logic
│   │   └── scripts/          # DB migrations, seeds
│   └── package.json
├── frontend/                 # React app
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── pages/            # Route pages
│   │   ├── store/            # Redux slices
│   │   └── services/         # API clients
│   └── package.json
└── README.md
```

## 🔧 Kiro Usage

This project demonstrates spec-driven development with Kiro:

### Steering Documents
- `architecture-principles.md` - Core design decisions
- `development-process.md` - How features are built
- `frontend-standards.md` - React/TypeScript conventions

### Feature Specs
Each feature follows: Requirements → Design → Tasks

Example: `.kiro/specs/pipe-forge-launch/`
- `requirements.md` - Acceptance criteria
- `design.md` - Technical approach
- `tasks.md` - Implementation checklist

## 🎃 Hackathon Category

**Resurrection** - Bringing Yahoo Pipes back to life with modern innovations.

### What Makes This a Resurrection?

1. **Faithful to the Original** - Visual data mashup with drag-and-drop
2. **Modern Technology** - React, TypeScript, PostgreSQL (not Flash!)
3. **New Capabilities** - Schema propagation, encrypted secrets, social features
4. **Solving Today's Problems** - API mashups, data transformation, automation

## 🚀 Deployment

### Production Build

```bash
# Backend
cd backend
npm run build
npm start  # Runs compiled JS from dist/

# Frontend
cd frontend
npm run build  # Creates dist/ folder
# Serve dist/ with any static host (Vercel, Netlify, Cloud Storage, etc.)
```

### GCP Cloud Run (Backend)

1. **Prerequisites**: GCP project with Cloud SQL (PostgreSQL) and Memorystore (Redis)
2. **Set environment variables** in Cloud Run console (see `backend/.env.example` for full list)
3. **Deploy**:
   ```bash
   cd backend
   gcloud run deploy pipe-forge-api --source . --region us-central1
   ```

### Frontend Hosting

The frontend is a static React app. After `npm run build`, deploy the `dist/` folder to:
- **Vercel/Netlify**: Connect repo, set build command to `cd frontend && npm run build`
- **GCP Cloud Storage**: `gsutil -m cp -r dist/* gs://your-bucket/`
- **Firebase Hosting**: `firebase deploy --only hosting`

### Environment Variables

See detailed setup in:
- `backend/.env.example` - All backend config with GCP notes
- `frontend/.env.example` - Frontend config (optional, uses proxy by default)

## 📝 License

MIT - See [LICENSE](./LICENSE) file

## 🙏 Acknowledgments

- Original Yahoo Pipes team (2007-2015)
- The Kiro team for an amazing IDE
- All developers who missed Yahoo Pipes
