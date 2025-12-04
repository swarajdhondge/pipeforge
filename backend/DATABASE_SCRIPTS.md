# Database Management Scripts

Quick reference for database management commands.

---

## 🔄 Reset and Seed (Recommended)

**Reset database, run migrations, and seed with templates:**
```bash
npm run db:reset-seed
```

This will:
1. Drop all tables
2. Run all migrations
3. Create system templates (categorized pipe examples)
4. Clear Redis cache

**Result:**
- 15+ pipe templates organized by category
- Templates are public and featured
- No test accounts created - just useful templates!

---

## 📦 Individual Commands

### Reset Database Only
```bash
npm run db:reset
```
⚠️ **WARNING:** Deletes ALL data!

### Run Migrations Only
```bash
npm run migrate
```

### Seed Templates Only
```bash
npm run db:seed
```
Creates system templates (requires migrations to be run first)

### Clear Redis Cache
```bash
npm run cache:clear
```
Clears all cached pipes and data from Redis

---

## 📦 Template Categories

After seeding, you'll have templates in these categories:

### Getting Started (Beginner)
- 🟢 First Steps: Fetch & Limit
- 📝 Last Items: Using Tail
- 🏷️ Rename Fields

### Data Processing (Intermediate)
- 🔍 Filter & Sort
- 🔄 Transform & Extract
- ✨ Remove Duplicates

### API Integration (Beginner/Intermediate)
- ⭐ GitHub Top Repos
- 👤 GitHub User Profile
- 🌤️ Weather Dashboard
- 💻 DEV.to Popular Articles

### RSS Feeds (Intermediate)
- 📰 Tech News Feed
- 📱 Reddit Feed Reader

### Advanced
- 🔴 Advanced: Multi-Filter Pipeline

---

## 🔧 Customizing Templates

Edit `backend/src/scripts/seed-db.ts` to customize:
- Template definitions
- Categories and difficulty levels
- Tags and descriptions

Templates are stored as system templates with `user_id = NULL` and `is_featured = true`.

---

## 📝 Usage Examples

### Fresh Start
```bash
# Clean slate with templates
npm run db:reset-seed

# Start backend
npm run dev
```

### After Code Changes
```bash
# If you added new migrations
npm run migrate

# If you want fresh templates
npm run db:reset-seed
```

### Production
```bash
# Only run migrations (never reset in production!)
npm run migrate

# Seed templates (safe to run - skips existing)
npm run db:seed
```

---

## ⚠️ Important Notes

1. **Never run `db:reset` in production** - it deletes all data
2. **Always backup production data** before running migrations
3. **Test migrations locally first** before deploying
4. **Templates are safe to run** - the seed script skips existing templates

---

## 🐛 Troubleshooting

### "Table already exists" error
```bash
npm run db:reset-seed
```

### "Column does not exist" error
```bash
# Check if migrations are up to date
npm run migrate
```

### "Connection refused" error
- Make sure PostgreSQL is running
- Check DATABASE_URL in .env file

---

## 📊 Verify Seeded Data

```bash
# Get featured templates (no auth needed)
curl http://localhost:3000/api/v1/pipes/featured

# Get all public pipes
curl http://localhost:3000/api/v1/pipes?page=1&limit=20
```
