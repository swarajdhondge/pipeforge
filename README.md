# 🔧 Pipe Forge

> A modern resurrection of Yahoo Pipes — the visual data pipeline builder.

**Built for the [Kiroween Hackathon](https://kiro.devpost.com/) 🎃**

---

## Overview

Yahoo Pipes (2007-2015) was a pioneering visual tool for aggregating, filtering, and transforming web data. **Pipe Forge** revives this concept with modern technologies, enabling users to create data pipelines through an intuitive drag-and-drop interface.

### Live Demo

| Service | URL |
|---------|-----|
| Frontend | https://pipeforge-480308-ab122.web.app |
| Backend API | https://pipeforge-api-1023389197722.us-central1.run.app |

---

## Architecture

![Pipe Forge Architecture](./docs/architecure.png)

---

## Features

### Visual Pipeline Editor
- Drag-and-drop operators from categorized sidebar
- Real-time schema propagation between nodes
- Inline node configuration
- Undo/Redo support (Ctrl+Z / Ctrl+Shift+Z)
- Canvas controls: zoom, pan, fit-to-view, mini-map

### Operators

| Category | Operators |
|----------|-----------|
| **Sources** | Fetch JSON, Fetch RSS, Fetch CSV, Fetch Page |
| **Operators** | Filter, Sort, Transform, Unique, Truncate, Tail, Rename |
| **String** | Replace, Regex, Substring |
| **URL** | URL Builder (dynamic parameters) |
| **User Input** | Text, Number, URL, Date |
| **Output** | Pipe Output |

### Security
- AES-256-GCM encrypted secrets storage
- Domain whitelist for external API calls
- Rate limiting on all endpoints
- Input validation and SQL injection prevention

### Social Features
- Browse and discover community pipes
- Fork public pipes
- Like/unlike pipes
- User profiles

---

## Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- Redis 7+ (Windows: [Memurai](https://www.memurai.com/))

### Setup

```bash
# Clone repository
git clone https://github.com/swarajdhondge/pipeforge.git
cd pipeforge

# Backend setup
cd backend
npm install
cp .env.example .env
# Configure .env with your database credentials
npm run migrate
npm run db:seed
npm run dev

# Frontend setup (new terminal)
cd ../frontend
npm install
cp .env.example .env
npm run dev
```

### Access
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### Test Account
```
Email: test@example.com
Password: TestPassword123!
```

---

## Deployment

The project is deployed on Google Cloud Platform with automated CI/CD via GitHub Actions.

**📖 For complete deployment instructions, see [Deployment Guide](./docs/DEPLOYMENT.md)**

### Quick Overview

- **Backend**: Google Cloud Run (auto-scaling containers)
- **Frontend**: Firebase Hosting (global CDN)
- **Database**: Cloud SQL (PostgreSQL)
- **Cache**: Upstash Redis
- **CI/CD**: GitHub Actions (auto-deploy on push to `main`)

---

## Project Structure

```
pipeforge/
├── .github/workflows/      # CI/CD pipelines
│   └── deploy.yml
├── backend/
│   ├── src/
│   │   ├── config/         # Environment configuration
│   │   ├── operators/      # Operator implementations
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   └── scripts/        # Migrations, seeds, utilities
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route pages
│   │   ├── store/          # Redux state management
│   │   ├── services/       # API clients
│   │   └── hooks/          # Custom React hooks
│   └── package.json
├── docs/                   # Documentation
├── firebase.json           # Firebase configuration
└── README.md
```

---

## Sample Templates

| Category | Templates |
|----------|-----------|
| Getting Started | First Steps, Last Items, Rename Fields |
| Data Processing | Filter & Sort, Transform & Extract, Remove Duplicates |
| API Integration | GitHub Top Repos, GitHub User Profile, Weather Dashboard |
| RSS & Feeds | Tech News Feed, Reddit Feed Reader |

---

## Scripts Reference

### Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run migrate      # Run database migrations
npm run db:seed      # Seed sample data
npm run db:reset     # Reset database
npm run cache:clear  # Clear Redis cache
```

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run test         # Run tests
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Database connection failed** | Verify `DATABASE_URL` in `.env` and ensure PostgreSQL is running |
| **Redis connection failed** | Check Redis is running and `REDIS_URL` is correct |
| **OAuth redirect mismatch** | Ensure redirect URI in Google Console matches exactly |
| **Cloud Run container failed** | Check `PORT=8080` and all required env vars are set |
| **Empty templates** | Run `npm run db:seed` to populate sample data |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License — see [LICENSE](./LICENSE)

---

## Acknowledgments

- Original Yahoo Pipes team (2007-2015) for the inspiration
- [Kiro](https://kiro.dev) team for the hackathon
- ReactFlow for the visual editor foundation
