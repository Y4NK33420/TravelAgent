# Database Setup Guide (Phase 2.2)

## Prerequisites

### 1. PostgreSQL Installation

**Windows:**
- Download from [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
- Install PostgreSQL 14+ with default settings
- Remember your postgres user password

**macOS:**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Qdrant (Vector Database)

**Using Docker (Recommended):**
```bash
docker run -p 6333:6333 -v $(pwd)/qdrant_storage:/qdrant/storage qdrant/qdrant
```

**Or install locally:**
- Download from [https://qdrant.tech/documentation/quick-start/](https://qdrant.tech/documentation/quick-start/)

---

## Database Configuration

### 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE travel_agent;

# Create user (optional, for production)
CREATE USER travel_agent_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE travel_agent TO travel_agent_user;

# Exit
\q
```

### 2. Update Environment Variables

Create or update `.env` file in `backend/` directory:

```env
# Existing keys
GOOGLE_MAPS_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here

# Database (Phase 2.2)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=travel_agent
DATABASE_USER=postgres
DATABASE_PASSWORD=your_postgres_password

# Vector Database
QDRANT_HOST=localhost
QDRANT_PORT=6333
QDRANT_COLLECTION_NAME=pois

# Authentication
JWT_SECRET_KEY=generate-a-secure-random-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=10080  # 7 days
```

**Generate a secure JWT secret:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## Running Migrations

### 1. Activate Virtual Environment

```bash
# Windows
.\venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 2. Run Alembic Migrations

```bash
# Upgrade to latest version
alembic upgrade head

# View migration history
alembic history

# Rollback one version
alembic downgrade -1

# Rollback to specific version
alembic downgrade <revision_id>
```

### 3. Create New Migrations (After Model Changes)

```bash
# Auto-generate migration
alembic revision --autogenerate -m "Description of changes"

# Review the generated migration file in alembic/versions/
# Edit if necessary, then upgrade
alembic upgrade head
```

---

## Database Schema

### Tables

1. **users** - User accounts and preferences
   - `id` (UUID, PK)
   - `email` (unique)
   - `hashed_password`
   - `preferences` (JSON)

2. **trips** - User's travel plans
   - `id` (UUID, PK)
   - `user_id` (FK → users)
   - `destination`
   - `constraints` (JSON)
   - `status` (planning, optimized, booked, completed)

3. **pois** - Cached place data
   - `id` (int, PK)
   - `place_id` (Google Places ID, unique)
   - `name`, `rating`, `lat`, `lng`
   - `details` (JSON)
   - `embedding` (JSON array, for semantic search)

4. **trip_pois** - Many-to-many with discovery context
   - `trip_id` (FK → trips)
   - `poi_id` (FK → pois)
   - `ai_score`, `score_breakdown`
   - `user_selected`, `user_rejected`

5. **itinerary_items** - Optimized schedule
   - `trip_id` (FK → trips)
   - `poi_id` (FK → pois, nullable)
   - `day_number`, `sequence_order`
   - `start_time`, `end_time`
   - `travel_leg` (JSON)

---

## Testing Database Connection

```python
import asyncio
from app.db import init_db, check_db_connection

async def test():
    await init_db()
    healthy = await check_db_connection()
    print(f"Database connection: {'✅ OK' if healthy else '❌ Failed'}")

asyncio.run(test())
```

---

## SQLite (Development/Testing)

For development without PostgreSQL, the system auto-detects and uses SQLite:

```env
ENVIRONMENT=test  # This triggers in-memory SQLite
```

No migrations needed for SQLite - tables are auto-created.

---

## Troubleshooting

### PostgreSQL Connection Failed

**Error:** `password authentication failed for user "postgres"`

**Solution:**
1. Reset postgres password:
   ```bash
   sudo -u postgres psql
   ALTER USER postgres PASSWORD 'new_password';
   ```
2. Update `.env` with new password

### Qdrant Not Running

**Error:** `Connection refused to localhost:6333`

**Solution:**
```bash
# Start Qdrant with Docker
docker run -d -p 6333:6333 qdrant/qdrant

# Or use cloud Qdrant (update QDRANT_HOST in .env)
```

### Migration Failed

**Error:** `Can't locate revision identified by 'abc123'`

**Solution:**
```bash
# Reset migrations (CAREFUL: destroys data)
alembic downgrade base
alembic upgrade head

# Or start fresh (development only)
DROP DATABASE travel_agent;
CREATE DATABASE travel_agent;
alembic upgrade head
```

---

## Production Deployment

### 1. Use Connection Pooling

Already configured in `app/db/database.py`:
- Pool size: 5 connections
- Max overflow: 10 connections
- Pool recycle: 1 hour

### 2. Environment Variables

Set via your hosting platform (Render, Railway, etc.):
```
DATABASE_HOST=your-db-host.com
DATABASE_PORT=5432
DATABASE_NAME=travel_agent
DATABASE_USER=your_user
DATABASE_PASSWORD=your_secure_password
```

### 3. SSL Connections (Production)

Update `app/db/database.py` to add SSL:
```python
_engine = create_async_engine(
    database_url,
    connect_args={"ssl": "require"}  # For production
)
```

### 4. Backup Strategy

```bash
# Backup database
pg_dump -U travel_agent_user travel_agent > backup.sql

# Restore
psql -U travel_agent_user travel_agent < backup.sql
```

---

## Next Steps

After database setup:
1. ✅ Run migrations: `alembic upgrade head`
2. ✅ Test connection: Run test script above
3. ✅ Start backend: `python start_server.py`
4. ✅ Access health check: `http://localhost:8000/health`

---

**Status:** Phase 2.2 Database Infrastructure Complete ✅












