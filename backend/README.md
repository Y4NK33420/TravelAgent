# Intelligent Travel Agent - Backend

Phase 1 implementation of an AI-powered travel recommendation agent using LangGraph, Google Maps, and Gemini.

## Setup Instructions

### 1. Create Virtual Environment (Already Done)
The virtual environment has been created in `venv/`.

### 2. Activate Virtual Environment
```powershell
# Windows PowerShell
.\venv\Scripts\Activate.ps1

# Or Command Prompt
.\venv\Scripts\activate.bat
```

### 3. Install Dependencies (Already Done)
Dependencies are already installed. To reinstall:
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Create a `.env` file in the `backend/` directory (copy from `env.example`):

```bash
# Copy the example file
cp env.example .env

# Edit .env and add your API keys
```

Required API keys:
- **Google Maps API Key**: Get from [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/credentials)
  - Enable APIs: Geocoding API, Places API, Maps JavaScript API
- **Gemini API Key**: Get from [Google AI Studio](https://aistudio.google.com/app/apikey)

### 5. Run the Server
```bash
python app/main.py

# Or using uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

- `GET /health` - Health check
- `POST /api/v1/trips` - Create new trip from natural language input
- `GET /api/v1/trips/{trip_id}/pois` - Get discovered POIs for a trip

## Testing

Run integration tests:
```bash
pytest tests/ -v
```

Run a specific test:
```bash
pytest tests/test_integration.py::test_geocoding -v
```

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration management
│   ├── models/              # Pydantic models and state definitions
│   ├── agents/              # LangGraph agents (Intake, Discovery)
│   ├── tools/               # LangGraph tools (geocoding, places, scoring)
│   ├── services/            # External API clients (Google Maps, Gemini)
│   └── api/                 # REST API endpoints
├── tests/                   # Integration tests
├── requirements.txt         # Python dependencies
└── .env                     # Environment variables (create this)
```

## Development

### Adding New Dependencies
```bash
pip install package-name
pip freeze > requirements.txt
```

### Code Quality
The project uses type hints throughout. Ensure your IDE supports Python type checking.

## Phase 1 Features

- ✅ Natural language trip constraint extraction (Intake Agent)
- ✅ POI discovery using Google Places API (Discovery Agent)
- ✅ Basic AI scoring for recommendations
- ✅ REST API for frontend integration
- ✅ Real-world testing framework

## Next Phase

Phase 2 will add:
- Database persistence (PostgreSQL + Vector DB)
- Itinerary optimization with OR-Tools
- Accommodation search
- Advanced scoring with dynamic signals
- Caching layer with Redis






