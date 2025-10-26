# Flight Analytics - Setup Guide

## Local Development Setup

### Step 1: Clone Repository
```bash
git clone <your-repo-url>
cd flight-analytics
```

### Step 2: Backend Setup

#### Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Configure Environment
Create `backend/.env`:
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=flight_analytics
CORS_ORIGINS=*
```

#### Download OpenFlights Data
Data is already included in `backend/data/` folder. If you need to re-download:

```bash
cd backend/data
curl -sL "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat" -o airports.dat
curl -sL "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat" -o airlines.dat
curl -sL "https://raw.githubusercontent.com/jpatokal/openflights/master/data/routes.dat" -o routes.dat
cd ../..
```

#### Ingest Data
```bash
cd backend
python3 data_ingestion.py
```

This will:
- Load 7,698 airports
- Load 6,162 airlines
- Load 67,240 routes
- Compute TF-IDF embeddings for each route
- Store everything in MongoDB

#### Start Backend Server
```bash
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

Backend will be running at: `http://localhost:8001`

API Documentation: `http://localhost:8001/docs`

### Step 3: Frontend Setup

#### Install Dependencies
```bash
cd frontend
yarn install
```

#### Configure Environment
Create `frontend/.env`:
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

#### Start Frontend
```bash
yarn start
```

Frontend will be running at: `http://localhost:3000`

### Step 4: Test the Application

1. Open `http://localhost:3000` in your browser
2. You should see the dashboard with statistics
3. Click "View Analytics" to explore data
4. Click "Find Routes" to search for route recommendations
5. Try searching for: JFK → LAX

## API Testing

### Test Backend APIs

```bash
# Get overall statistics
curl http://localhost:8001/api/analytics/stats

# Get busiest airports
curl "http://localhost:8001/api/analytics/busiest-airports?limit=5"

# Search for airports
curl "http://localhost:8001/api/search/airports?q=london&limit=5"

# Get route recommendations
curl "http://localhost:8001/api/recommendations/similar-routes?source=JFK&destination=LAX&top_k=10"
```

## Production Deployment

### Using Supervisor (Linux)

Create supervisor configs:

**Backend** (`/etc/supervisor/conf.d/flight-backend.conf`):
```ini
[program:flight-backend]
command=/path/to/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
directory=/app/backend
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/flight-backend.err.log
stdout_logfile=/var/log/supervisor/flight-backend.out.log
```

**Frontend** (`/etc/supervisor/conf.d/flight-frontend.conf`):
```ini
[program:flight-frontend]
command=/usr/bin/yarn start
directory=/app/frontend
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/flight-frontend.err.log
stdout_logfile=/var/log/supervisor/flight-frontend.out.log
```

Restart supervisor:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start flight-backend flight-frontend
```

### Using Docker

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  backend:
    build: ./backend
    ports:
      - "8001:8001"
    environment:
      - MONGO_URL=mongodb://mongodb:27017
      - DB_NAME=flight_analytics
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_BACKEND_URL=http://localhost:8001
    depends_on:
      - backend

volumes:
  mongo_data:
```

Run:
```bash
docker-compose up -d
```

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Test connection
mongosh --eval "db.serverStatus()"
```

### Backend Import Errors
```bash
# Reinstall dependencies
cd backend
pip install --upgrade -r requirements.txt
```

### Frontend Build Errors
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules yarn.lock
yarn install
```

### Port Already in Use
```bash
# Backend (port 8001)
sudo lsof -ti:8001 | xargs kill -9

# Frontend (port 3000)
sudo lsof -ti:3000 | xargs kill -9
```

## Development Tips

### Hot Reload
Both backend and frontend support hot reload:
- Backend: `uvicorn server:app --reload`
- Frontend: `yarn start` (automatic)

### Database Exploration
```bash
# Open MongoDB shell
mongosh

# Use database
use flight_analytics

# Check collections
show collections

# Query airports
db.airports.findOne()

# Count routes
db.routes.countDocuments()
```

### API Documentation
Visit `http://localhost:8001/docs` for interactive API documentation (Swagger UI)

### Environment Variables

**Backend:**
- `MONGO_URL` - MongoDB connection string
- `DB_NAME` - Database name
- `CORS_ORIGINS` - Allowed CORS origins

**Frontend:**
- `REACT_APP_BACKEND_URL` - Backend API URL

## Next Steps

1. Explore the code in `backend/server.py`
2. Check out the data ingestion script in `backend/data_ingestion.py`
3. Review the React components in `frontend/src/pages/`
4. Try modifying the UI styles in `frontend/src/App.css`
5. Add new API endpoints or analytics queries

## Support

For issues or questions:
1. Check the main [README.md](README.md)
2. Review the troubleshooting section
3. Check backend logs: `tail -f /var/log/supervisor/backend.err.log`
4. Check frontend logs in browser console (F12)

Happy coding! 🚀
