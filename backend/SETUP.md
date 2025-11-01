# Setup Guide - Intelligent Travel Agent Backend

## Quick Start

Follow these steps to get your backend up and running:

### Step 1: Get API Keys

You need two API keys:

#### 1. Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable these APIs:
   - **Geocoding API**
   - **Places API**
   - **Maps JavaScript API**
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy your API key

#### 2. Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Get API Key"
3. Copy your API key

### Step 2: Configure Environment Variables

1. Navigate to the `backend` directory
2. Copy the example environment file:
   ```bash
   cp env.example .env
   ```
3. Edit `.env` and add your API keys:
   ```bash
   GOOGLE_MAPS_API_KEY=your_google_maps_key_here
   GEMINI_API_KEY=your_gemini_key_here
   ```

### Step 3: Activate Virtual Environment

The virtual environment and dependencies are already installed!

**Windows PowerShell:**
```powershell
.\venv\Scripts\Activate.ps1
```

**Windows Command Prompt:**
```cmd
.\venv\Scripts\activate.bat
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

### Step 4: Run the Server

```bash
python app/main.py
```

Or using uvicorn directly:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The server will start at: **http://localhost:8000**

### Step 5: Test the API

#### Option 1: Interactive API Docs
Open your browser and go to: **http://localhost:8000/docs**

This will show you the interactive Swagger UI where you can test all endpoints.

#### Option 2: Using curl

**Health Check:**
```bash
curl http://localhost:8000/api/v1/health
```

**Create a Trip:**
```bash
curl -X POST http://localhost:8000/api/v1/trips \
  -H "Content-Type: application/json" \
  -d '{"user_message": "I want to visit Paris for 5 days, love art and food"}'
```

**Get POIs (replace {trip_id} with the ID from above):**
```bash
curl http://localhost:8000/api/v1/trips/{trip_id}/pois
```

#### Option 3: Run Integration Tests
```bash
pytest tests/test_integration.py -v
```

## Troubleshooting

### Issue: API Key Not Found

**Error:** `ValueError: Google Maps API key not found in environment variables`

**Solution:**
1. Make sure you created the `.env` file in the `backend/` directory
2. Check that the file contains both API keys
3. Make sure there are no quotes around the keys
4. Restart the server after adding keys

### Issue: Import Errors

**Error:** `ModuleNotFoundError: No module named 'fastapi'`

**Solution:**
Make sure your virtual environment is activated and dependencies are installed:
```bash
.\venv\Scripts\Activate.ps1  # Windows PowerShell
pip install -r requirements.txt
```

### Issue: Google Maps API Returns Errors

**Error:** `Google Maps API error: REQUEST_DENIED`

**Solution:**
1. Make sure you've enabled the required APIs in Google Cloud Console
2. Check that your API key has no restrictions preventing usage
3. Verify billing is enabled on your Google Cloud project

### Issue: Gemini API Errors

**Error:** `Error generating content with Gemini`

**Solution:**
1. Verify your Gemini API key is correct
2. Check you have quota/credits available
3. Try regenerating the API key in Google AI Studio

## API Endpoints Reference

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Root endpoint with API info |
| GET | `/docs` | Interactive API documentation |
| GET | `/api/v1/health` | Health check + service status |
| POST | `/api/v1/trips` | Create new trip from natural language |
| GET | `/api/v1/trips/{trip_id}` | Get trip details |
| GET | `/api/v1/trips/{trip_id}/pois` | Get discovered POIs for a trip |
| DELETE | `/api/v1/trips/{trip_id}` | Delete a trip |

## Project Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI app entry point
│   ├── config.py               # Configuration management
│   ├── models/
│   │   ├── state.py           # LangGraph state definitions
│   │   └── schemas.py         # API request/response models
│   ├── services/
│   │   ├── google_maps.py     # Google Maps client
│   │   └── gemini.py          # Gemini AI client
│   ├── tools/
│   │   ├── geocoding.py       # Geocoding tool
│   │   ├── places.py          # Places discovery tool
│   │   └── scoring.py         # POI scoring tool
│   ├── agents/
│   │   ├── intake.py          # Constraint extraction agent
│   │   ├── discovery.py       # POI discovery agent
│   │   └── graph.py           # LangGraph workflow
│   └── api/
│       └── routes.py          # REST API endpoints
├── tests/
│   └── test_integration.py    # Integration tests
├── venv/                       # Virtual environment
├── requirements.txt            # Python dependencies
├── .env                        # Environment variables (create this!)
└── README.md                   # Documentation
```

## Development Workflow

### Making Changes

1. Make your code changes
2. Test locally:
   ```bash
   python app/main.py
   ```
3. Run tests:
   ```bash
   pytest tests/ -v
   ```

### Adding New Dependencies

```bash
pip install package-name
pip freeze > requirements.txt
```

### Viewing Logs

The application logs to console. Adjust log level in `.env`:
```
LOG_LEVEL=DEBUG  # Options: DEBUG, INFO, WARNING, ERROR
```

## Example API Requests

### Simple Trip

```json
POST /api/v1/trips
{
  "user_message": "I want to visit Tokyo for a week"
}
```

### Detailed Trip

```json
POST /api/v1/trips
{
  "user_message": "Planning a romantic honeymoon in Bali for 10 days in June, love beaches and spa treatments, luxury budget"
}
```

### Family Trip

```json
POST /api/v1/trips
{
  "user_message": "Family trip to London with kids aged 8 and 12, 5 days, interested in history and museums, moderate budget"
}
```

## What's Working (Phase 1)

✅ Natural language trip parsing  
✅ Destination geocoding  
✅ POI discovery using Google Places  
✅ AI-powered scoring and ranking  
✅ Budget-aware recommendations  
✅ Vibe-based place type selection  
✅ REST API with full documentation  
✅ Real-time processing  

## Coming in Phase 2

⏳ Database persistence (PostgreSQL + Vector DB)  
⏳ Itinerary optimization with OR-Tools  
⏳ Accommodation search  
⏳ Advanced scoring (weather, events, sentiment)  
⏳ Redis caching layer  
⏳ User authentication  
⏳ Trip history and sharing  

## Support

For issues or questions:
1. Check the logs for detailed error messages
2. Verify API keys are correctly configured
3. Ensure all APIs are enabled in Google Cloud Console
4. Check that you're using Python 3.10+

## Performance Tips

- The first request may be slower as services initialize
- POI discovery makes multiple API calls (expect 3-10 seconds)
- Use the `/health` endpoint to verify services are ready
- Consider implementing caching in Phase 2 for production use

---

**Happy Building! 🚀**









