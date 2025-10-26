# \ud83d\ude80 Quick Deploy Guide - Flight Analytics

## GitHub Deployment (5 minutes)

### Step 1: Initialize Git Repository

```bash
cd /app
bash setup_github.sh
```

This will:
- Initialize git
- Create .gitignore
- Stage all files
- Create initial commit

### Step 2: Create GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. Create a new repository named `flight-analytics`
3. Don't initialize with README (we already have one)
4. Copy the repository URL

### Step 3: Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/flight-analytics.git
git branch -M main
git push -u origin main
```

\u2705 **Your code is now on GitHub!**

---

## Localhost Deployment (10 minutes)

### Prerequisites
- MongoDB running on localhost:27017
- Python 3.9+
- Node.js 16+ and Yarn

### Terminal 1: Backend

```bash
cd /app/backend

# Install dependencies
pip install -r requirements.txt

# Ensure data is ingested
python3 data_ingestion.py

# Start backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

\u2705 Backend running at `http://localhost:8001`

### Terminal 2: Frontend

```bash
cd /app/frontend

# Install dependencies
yarn install

# Start frontend
yarn start
```

\u2705 Frontend running at `http://localhost:3000`

### Test It!

1. Open http://localhost:3000
2. View statistics on dashboard
3. Click \"View Analytics\"
4. Click \"Find Routes\" and search: JFK \u2192 LAX

---

## Production Deployment

### Emergent (Already Live!)

\ud83c\udf89 **Live Demo**: https://routeradar-1.preview.emergentagent.com

The app is already deployed and fully functional!

---

## Quick Links

- \ud83d\udcd6 [Full README](README.md)
- \ud83d\udd27 [Setup Guide](SETUP.md)
- \ud83d\ude80 [Live Demo](https://routeradar-1.preview.emergentagent.com)

**Made for MariaDB Hackathon 2025** \u2708\ufe0f
