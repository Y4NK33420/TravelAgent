# Quick Setup Guide - PostgreSQL & Pinecone

## Prerequisites

### For PostgreSQL:
1. Install Docker Desktop for Windows: https://www.docker.com/products/docker-desktop/

### For Pinecone (Vector Search):
1. Create free account: https://www.pinecone.io/
2. Get API key from dashboard

---

## Start Services

### PostgreSQL (via Docker)

```bash
# Start PostgreSQL
docker run -d \
  --name travel-agent-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=travel_agent \
  -p 5432:5432 \
  postgres:16

# Verify it's running
docker ps
```

### Pinecone (Cloud - No Installation!)

Just get your API key from https://app.pinecone.io/ - that's it!

**Much simpler than Qdrant!** ✨

### Stop/Start PostgreSQL Later

```bash
# Stop
docker stop travel-agent-db

# Start again
docker start travel-agent-db

# Remove completely (careful - deletes data!)
docker rm -f travel-agent-db
```

---

## Option 2: Native Installation (Windows)

### PostgreSQL Installation

1. **Download PostgreSQL**
   - Go to: https://www.postgresql.org/download/windows/
   - Download version 16.x installer
   - Run the installer

2. **During Installation:**
   - Port: `5432` (default)
   - Password: Choose a password (remember it!)
   - Components: Select all (PostgreSQL Server, pgAdmin, Command Line Tools)

3. **Verify Installation:**
   ```cmd
   # Open Command Prompt
   psql --version
   ```

4. **Create Database:**
   ```cmd
   # Connect to PostgreSQL
   psql -U postgres
   
   # Enter your password when prompted
   
   # Create database
   CREATE DATABASE travel_agent;
   
   # Exit
   \q
   ```

### Pinecone Setup

**No installation needed!** Pinecone is cloud-based.

1. Go to: https://www.pinecone.io/
2. Sign up for free account
3. Get your API key from https://app.pinecone.io/
4. Add it to `.env` file (see next section)

---

## Configuration

### Update .env file

```bash
cd C:\Users\Yugam\Downloads\HCI_WORKING\backend
```

Create or update `.env`:

```env
# Existing keys (keep these)
GOOGLE_MAPS_API_KEY=AIzaSyCO0sjeIyEvTcDvE47hAepDwOlTC9oGXXo
GEMINI_API_KEY=AIzaSyBz3X1ifrsadOzzl_0bmGRx3TDfihjlxE0
ENVIRONMENT=development
LOG_LEVEL=INFO
HOST=0.0.0.0
PORT=8000

# Database (Phase 2.2) - ADD THESE
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=travel_agent
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres

# Vector Database - ADD THESE
QDRANT_HOST=localhost
QDRANT_PORT=6333
QDRANT_COLLECTION_NAME=pois

# Authentication - ADD THIS
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=10080
```

**Generate a secure JWT secret:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```
Replace `your-secret-key-change-in-production` with the output.

---

## Run Database Migrations

```bash
# Make sure you're in the backend directory
cd C:\Users\Yugam\Downloads\HCI_WORKING\backend

# Activate virtual environment
.\venv\Scripts\activate

# Run migrations
alembic upgrade head
```

You should see:
```
INFO  [alembic.runtime.migration] Running upgrade  -> 001, Initial schema - users, trips, pois, itinerary
```

---

## Verify Setup

### Test Database Connection

```bash
# Try connecting with psql
psql -U postgres -d travel_agent

# You should see:
# travel_agent=#

# List tables
\dt

# Should show: users, trips, pois, trip_pois, itinerary_items
# Exit
\q
```

### Test Qdrant

Open browser: http://localhost:6333/dashboard

You should see the Qdrant dashboard.

### Test Backend

```bash
# Start the backend
python start_server.py
```

You should see:
```
✓ Database initialized
✓ Vector store initialized
✓ Google Maps service initialized
✓ Gemini service initialized
✓ Travel agent graph compiled
All services initialized successfully!
```

Visit: http://localhost:8000/docs

---

## Troubleshooting

### PostgreSQL Issues

**Error: "password authentication failed"**
```bash
# Reset password
psql -U postgres
ALTER USER postgres PASSWORD 'newpassword';
\q

# Update .env with new password
```

**Error: "could not connect to server"**
- Check if PostgreSQL is running:
  - Windows: Services → PostgreSQL 16 → Start
  - Docker: `docker ps` (should see postgres container)

### Qdrant Issues

**Error: "Connection refused"**
```bash
# Docker: Check if running
docker ps | grep qdrant

# If not running
docker start travel-agent-qdrant

# Or create new container
docker run -d --name travel-agent-qdrant -p 6333:6333 qdrant/qdrant
```

**Port 6333 already in use:**
```bash
# Find process using port
netstat -ano | findstr :6333

# Kill it (use PID from above)
taskkill /PID <pid> /F

# Or use different port in .env
QDRANT_PORT=6334
```

### Migration Issues

**Error: "Can't locate revision"**
```bash
# Reset migrations (CAREFUL: deletes data)
psql -U postgres -d travel_agent -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
alembic upgrade head
```

---

## Quick Test

After setup, test everything:

```bash
# In backend directory with venv activated
python -c "
import asyncio
from app.db import init_db, check_db_connection

async def test():
    await init_db()
    healthy = await check_db_connection()
    print(f'Database: {'✅' if healthy else '❌'}')

asyncio.run(test())
"
```

Should output: `Database: ✅`

---

## Docker Compose (Advanced - All-in-One)

Create `docker-compose.yml` in backend directory:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    container_name: travel-agent-db
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: travel_agent
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  qdrant:
    image: qdrant/qdrant
    container_name: travel-agent-qdrant
    ports:
      - "6333:6333"
    volumes:
      - qdrant_storage:/qdrant/storage

volumes:
  postgres_data:
  qdrant_storage:
```

Then run:
```bash
docker-compose up -d
```

---

## Summary - What to Do

**Easiest Path (5 minutes):**
1. Install Docker Desktop
2. Run the 2 docker commands (PostgreSQL + Qdrant)
3. Update `.env` file
4. Run `alembic upgrade head`
5. Run `python start_server.py`

**Done!** ✅





