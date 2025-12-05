# Deployment Guide

Complete guide for deploying Pipe Forge to Google Cloud Platform.

---

## Prerequisites

- Google Cloud Platform account with billing enabled
- Firebase project
- GitHub repository with Actions enabled
- Google OAuth credentials

---

## 1. GCP Service Account Setup

### Create Service Account

```bash
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions"
```

### Grant Required Permissions

```bash
PROJECT_ID=your-project-id
SA_EMAIL=github-actions@${PROJECT_ID}.iam.gserviceaccount.com

# Cloud Run deployment
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/run.admin"

# Service account usage
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/iam.serviceAccountUser"

# Artifact Registry (read/write)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/artifactregistry.reader"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/artifactregistry.writer"

# Cloud Storage
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/storage.objectAdmin"

# Cloud Build
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/cloudbuild.builds.editor"

# Logging
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/logging.viewer"

# Service Usage
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/serviceusage.serviceUsageConsumer"
```

### Download Service Account Key

```bash
gcloud iam service-accounts keys create gcp-key.json \
  --iam-account=$SA_EMAIL

cat gcp-key.json  # Copy this for GitHub secret
```

---

## 2. Artifact Registry Setup

```bash
gcloud artifacts repositories create cloud-run-source-deploy \
  --repository-format=docker \
  --location=us-central1 \
  --description="Docker images for Cloud Run"
```

---

## 3. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create or select your project
3. Navigate to ⚙️ Settings → **Service accounts**
4. Click **Generate new private key**
5. Save the JSON file for GitHub secrets

---

## 4. Google OAuth Setup

1. Go to [Google Cloud Console → APIs & Credentials](https://console.cloud.google.com/apis/credentials)
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Application type: **Web application**
4. Add Authorized JavaScript origins:
   - `http://localhost:5173`
   - `https://your-app.web.app`
5. Add Authorized redirect URIs:
   - `http://localhost:3000/api/v1/auth/google/callback`
   - `https://your-api.run.app/api/v1/auth/google/callback`

---

## 5. GitHub Secrets

Add these secrets in GitHub → Repository → Settings → Secrets → Actions:

| Secret | Value |
|--------|-------|
| `GCP_SA_KEY` | Contents of `gcp-key.json` |
| `FIREBASE_SERVICE_ACCOUNT` | Contents of Firebase service account JSON |
| `GOOGLE_CLIENT_ID` | OAuth Client ID |

---

## 6. Cloud Run Configuration

Configure these environment variables in Cloud Run Console:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `8080` |
| `DATABASE_URL` | `postgresql://user:pass@/db?host=/cloudsql/project:region:instance` |
| `REDIS_URL` | Upstash Redis URL |
| `JWT_SECRET` | 64-character hex string |
| `SECRETS_ENCRYPTION_KEY` | 64-character hex string |
| `GOOGLE_CLIENT_ID` | OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret |
| `GOOGLE_REDIRECT_URI` | `https://your-api.run.app/api/v1/auth/google/callback` |
| `FRONTEND_URL` | `https://your-app.web.app` |
| `CORS_ORIGINS` | `https://your-app.web.app` |
| `STORAGE_PROVIDER` | `disk` |

### Generate Secure Keys

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate SECRETS_ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 7. Database Setup

### Cloud SQL Instance

1. Create PostgreSQL instance in Cloud SQL
2. Create database and user
3. Configure private IP or Cloud SQL Proxy

### Seed Production Database

Option 1: Via Cloud Shell
```bash
gcloud sql connect INSTANCE_NAME --user=postgres --database=DATABASE_NAME
# Run seed SQL manually
```

Option 2: Via Cloud SQL Proxy
```bash
# Start proxy locally
cloud_sql_proxy -instances=PROJECT:REGION:INSTANCE=tcp:5432

# Run seed
DATABASE_URL=postgresql://user:pass@localhost:5432/db npm run db:seed
```

---

## 8. Deploy

Push to `main` branch to trigger deployment:

```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

Monitor deployment in GitHub Actions tab.

---

## IAM Roles Reference

| Role | Purpose |
|------|---------|
| `roles/run.admin` | Deploy to Cloud Run |
| `roles/iam.serviceAccountUser` | Act as service account |
| `roles/artifactregistry.reader` | Pull Docker images |
| `roles/artifactregistry.writer` | Push Docker images |
| `roles/storage.admin` | Access Cloud Storage |
| `roles/storage.objectAdmin` | Manage storage objects |
| `roles/cloudbuild.builds.editor` | Trigger Cloud Build |
| `roles/logging.viewer` | View build logs |
| `roles/serviceusage.serviceUsageConsumer` | API enablement checks |

---

## Troubleshooting

### Permission denied on Artifact Registry
Ensure `roles/artifactregistry.reader` and `roles/artifactregistry.writer` are granted.

### Container failed to start
1. Check logs: `gcloud logging read "resource.type=cloud_run_revision"`
2. Verify all environment variables are set
3. Ensure `PORT=8080`

### OAuth redirect_uri_mismatch
1. Verify redirect URI matches exactly in Google Console
2. Include full path: `https://your-api.run.app/api/v1/auth/google/callback`
3. Wait 5 minutes for propagation

### Database connection failed
1. Verify Cloud SQL instance is running
2. Check connection string format
3. Ensure Cloud SQL Admin API is enabled
