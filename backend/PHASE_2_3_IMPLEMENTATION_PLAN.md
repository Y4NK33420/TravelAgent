# Phase 2.3 Implementation Plan: Accommodation & Transport Agents

**Based on:** API_RESEARCH.md comprehensive analysis  
**Target:** Production-ready Accommodation and Transport data integration  
**Timeline:** 4-6 weeks  
**Budget:** $200-500/month (MVP) → $500-1,000/month (Production)

---

## Executive Summary

After reviewing 1,474 lines of API research covering 15+ data sources, this plan recommends a **phased hybrid approach**:

1. **Weeks 1-2:** Implement MVP with immediate-access APIs (Amadeus + Google)
2. **Weeks 3-4:** Enhance with price intelligence layer (SerpAPI)
3. **Weeks 5-6:** Apply for partnerships (Skyscanner, Busbud) and optimize

**Key Decision:** ✅ **Start with Amadeus APIs** (self-service, legally compliant) rather than scraping (legal gray area, high maintenance).

---

## Part 1: Data Source Selection (Final Recommendations)

### 1.1 Accommodation Data

| Priority | Provider | Rationale | Status |
|----------|----------|-----------|--------|
| **Primary** | **Amadeus Hotel API** | ✅ Self-service<br>✅ 150K+ hotels<br>✅ Legal compliance<br>✅ Booking integration<br>⚠️ Published GDS rates | APPROVED |
| **Secondary** | **SerpAPI Google Hotels** | ✅ Price intelligence<br>✅ Aggregates 200+ OTAs<br>✅ Historical pricing<br>⚠️ No booking (deep links only) | APPROVED (Layer 2) |
| **Rejected** | Apify/Booking Scraper | ❌ TOS violations<br>❌ High maintenance<br>❌ Legal risk | NOT RECOMMENDED |
| **Future** | Expedia Rapid API | ⏳ Requires partnership approval<br>✅ 700K+ properties<br>Apply in Phase 3 | DEFERRED |

**Cost Analysis:**
- Amadeus: ~$0.01-0.05 per search (after free tier)
- SerpAPI: ~$0.05 per search
- **Total per trip:** $0.06-0.10 (10 accommodation searches)

---

### 1.2 Flight Data

| Priority | Provider | Rationale | Status |
|----------|----------|-----------|--------|
| **Primary** | **Amadeus Flight Offers Search API** | ✅ 400+ airlines<br>✅ Self-service<br>✅ Booking integration<br>⚠️ Published rates (6x higher than direct) | APPROVED |
| **Secondary** | **Skyscanner Flight API** | ✅ Strong LCC coverage<br>✅ Free cached search<br>⚠️ Requires approval | APPLY NOW |
| **Rejected** | Kiwi.com Tequila | ❌ $100K/month revenue requirement<br>Too high barrier for MVP | NOT VIABLE |

**Cost Analysis:**
- Amadeus: ~$0.01-0.05 per search (after free tier)
- Skyscanner: Free (cached) / ~$0.02 (live after approval)
- **Total per trip:** $0.02-0.10 (2 flight searches)

---

### 1.3 Multi-Modal Transport

| Priority | Provider | Rationale | Status |
|----------|----------|-----------|--------|
| **Primary** | **Google Maps Routes API** | ✅ Immediate access<br>✅ Global transit coverage<br>✅ Best documentation<br>⚠️ Price increase March 2025 | APPROVED |
| **Secondary** | **Busbud API** | ✅ Inter-city bus/rail<br>✅ Partnership available<br>⚠️ Revenue share model | APPLY NOW |
| **Rejected** | Rome2rio API | ❌ Not accepting new applications | NOT AVAILABLE |
| **Rejected** | Omio/Trainline | ❌ Partnership barriers<br>❌ Enterprise-focused | TOO COMPLEX |

**Cost Analysis:**
- Google Routes: ~$0.005-0.01 per route (after free credit)
- **Total per trip:** $0.025-0.05 (5 route calculations)

---

### 1.4 Total Cost Per Trip Summary

**Current Architecture (Amadeus + Google):**
- Accommodation: $0.025 (10 searches × $0.0025)
- Flights: $0.011 (2 searches × $0.0055)
- Routes: $0.023 (5 routes × $0.0046)
- **Total: $0.059 per trip**

**At 10,000 trips/month:**
- API costs: **$590/month**
- Infrastructure: **$100/month** (database, Redis, hosting)
- **Total: ~$700/month**

**With SerpAPI Layer (Price Intelligence):**
- Additional: $0.50 per trip (10 searches × $0.05)
- **Total with intelligence: $0.559 per trip**
- **At 10K trips/month: $5,590/month** ⚠️ Too expensive for primary use
- **Recommendation:** Use SerpAPI for async price intelligence only (1-2 checks/day per popular destination)

---

## Part 2: Architecture Design

### 2.1 Swappable Provider Pattern (Already Defined in Research)

The research document provides excellent abstract base class examples. We'll implement:

```python
# backend/app/services/providers/accommodation.py
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional
from datetime import date

@dataclass
class Hotel:
    """Standardized hotel data model"""
    provider_id: str
    provider: str
    name: str
    latitude: float
    longitude: float
    price: float
    currency: str
    rating: Optional[float]
    review_count: Optional[int]
    photo_url: Optional[str]
    amenities: List[str]
    cancellation_policy: Optional[str]
    raw_data: dict  # For debugging

class AccommodationProvider(ABC):
    @abstractmethod
    async def search(
        self,
        destination: str,
        checkin_date: date,
        checkout_date: date,
        num_guests: int,
        filters: Optional[dict] = None
    ) -> List[Hotel]:
        pass
    
    @abstractmethod
    async def get_details(self, provider_id: str) -> Optional[Hotel]:
        pass

# Similar patterns for FlightProvider, RouteProvider
```

### 2.2 Configuration-Driven Provider Selection

```python
# backend/app/config.py (additions)
class Settings(BaseSettings):
    # Existing settings...
    
    # Accommodation providers
    accommodation_provider: str = "amadeus"  # "amadeus" | "serpapi" | "aggregator"
    amadeus_api_key: str
    amadeus_api_secret: str
    serpapi_key: Optional[str] = None
    
    # Flight providers
    flight_provider: str = "amadeus"  # "amadeus" | "skyscanner"
    skyscanner_api_key: Optional[str] = None
    
    # Transport providers
    route_provider: str = "google_maps"  # Already have this
    busbud_api_key: Optional[str] = None
```

### 2.3 Service Layer Architecture

```
backend/app/services/
├── providers/
│   ├── __init__.py
│   ├── base.py                    # ABC definitions
│   ├── accommodation/
│   │   ├── __init__.py
│   │   ├── amadeus.py             # AmadeusHotelProvider
│   │   └── serpapi.py             # SerpAPIHotelProvider
│   ├── flights/
│   │   ├── __init__.py
│   │   ├── amadeus.py             # AmadeusFlightProvider
│   │   └── skyscanner.py          # SkyscannerFlightProvider (when approved)
│   └── transport/
│       ├── __init__.py
│       ├── google_routes.py       # Already exists, refactor
│       └── busbud.py               # BusbudTransportProvider (when approved)
├── accommodation_service.py        # Facade/aggregator
├── flight_service.py               # Facade/aggregator
└── transport_service.py            # Enhanced version
```

---

## Part 3: Implementation Roadmap

### **Week 1: Amadeus Hotel API Integration**

**Goals:**
- OAuth 2.0 authentication
- Hotel search by city/coordinates
- Hotel details retrieval
- Cache integration

**Tasks:**
1. Create `AmadeusHotelProvider` class
2. Implement OAuth token management (with refresh)
3. Implement search workflow:
   - Hotel List API (get hotel IDs by city)
   - Hotel Search API (get offers)
4. Transform Amadeus response → standardized `Hotel` model
5. Integrate with existing `CacheService`
6. Unit tests with mocked responses
7. Integration test with real API (free tier)

**Deliverables:**
```python
# backend/app/services/providers/accommodation/amadeus.py
class AmadeusHotelProvider(AccommodationProvider):
    async def search(self, destination, checkin_date, checkout_date, num_guests):
        # 1. Geocode destination (reuse existing google_maps_service)
        # 2. Get hotel IDs via Hotel List API
        # 3. Query Hotel Search API with filters
        # 4. Parse response → List[Hotel]
        # 5. Cache results
        pass
```

**Code Example from Research:**
```python
# Authentication (reusable)
import requests

auth_url = "https://api.amadeus.com/v1/security/oauth2/token"
auth_data = {
    "grant_type": "client_credentials",
    "client_id": settings.amadeus_api_key,
    "client_secret": settings.amadeus_api_secret
}
auth_response = requests.post(auth_url, data=auth_data)
access_token = auth_response.json()["access_token"]
```

**Testing:**
- Use Amadeus **test environment** (free tier)
- Test cities: NYC, Paris, Tokyo
- Validate: price formatting, amenities parsing, photo URLs

---

### **Week 2: Amadeus Flight API Integration**

**Goals:**
- Flight search by origin/destination/dates
- Multi-city support
- Price confirmation workflow

**Tasks:**
1. Create `AmadeusFlightProvider` class
2. Implement flight search:
   - Flight Offers Search API
   - Flight Offers Price API (confirmation)
3. Handle multi-leg flights
4. Add CO2 emissions data
5. Cache integration
6. Unit + integration tests

**Deliverables:**
```python
# backend/app/services/providers/flights/amadeus.py
class AmadeusFlightProvider(FlightProvider):
    async def search(self, origin, destination, departure_date, return_date):
        # 1. Search flight offers
        # 2. Parse itineraries
        # 3. Calculate CO2 (if available)
        # 4. Transform → List[Flight]
        pass
```

**API Flow (from research):**
1. **Flight Offers Search:** Find bookable offers
2. **Flight Offers Price:** Confirm latest price + availability
3. *(Future)* **Flight Create Orders:** Complete booking

**Testing:**
- Test routes: NYC↔LON, PAR↔TYO, LAX↔SYD
- Validate: layovers, multi-carrier, price accuracy

---

### **Week 3: Google Routes API Enhancement**

**Goals:**
- Refactor existing `calculate_travel_time_matrix` into provider pattern
- Add transit mode support
- Add walking/driving/bicycling modes

**Tasks:**
1. Refactor `GoogleMapsService.calculate_travel_time_matrix` → `GoogleRoutesProvider`
2. Implement transit routing:
   - Directions API with `mode=transit`
   - Parse transit legs (bus, subway, train)
   - Extract fare information
3. Add route alternatives
4. Cache routes (5-minute TTL for traffic sensitivity)
5. Cost tracking integration

**Deliverables:**
```python
# backend/app/services/providers/transport/google_routes.py
class GoogleRoutesProvider(RouteProvider):
    async def get_route(
        self,
        origin: dict,
        destination: dict,
        mode: str = "transit",
        departure_time: Optional[datetime] = None
    ) -> Route:
        # 1. Call Directions API with transit mode
        # 2. Parse legs (walking, bus, subway, etc.)
        # 3. Extract fare data
        # 4. Transform → Route model
        pass
```

**Testing:**
- Test cities with good transit: NYC, London, Tokyo, Paris
- Validate: transfer counts, fare accuracy, time estimates

---

### **Week 4: LangGraph Agent Integration**

**Goals:**
- Create `AccommodationAgent` and `TransportAgent` nodes
- Integrate into existing graph workflow
- Connect to Discovery Agent output

**Tasks:**
1. Create `backend/app/agents/accommodation.py`
   - Input: destination, dates, budget, POI list (from Discovery)
   - Output: ranked hotel list with commute times to POI clusters
2. Create `backend/app/agents/transport.py`
   - Input: origin/destination cities, dates
   - Output: flight/train options
3. Update `app/agents/graph.py`:
   - Add accommodation node after Discovery
   - Add transport node at start (arrival options)
4. Calculate commute times: hotels → POI clusters
5. Score accommodations by:
   - Price fit
   - Rating
   - Average commute time to POIs
   - Amenities match

**Graph Flow Update:**
```
Intake → Discovery → Accommodation → Optimizer → Transport (departure)
                          ↓
                    (commute times calculated using Routes API)
```

**Deliverables:**
```python
# backend/app/agents/accommodation.py
async def accommodation_agent(state: TravelAgentState) -> dict:
    """
    Find and score hotels based on:
    1. Budget constraints
    2. Proximity to POI clusters
    3. Rating and amenities
    """
    constraints = state["constraints"]
    pois = state["potential_pois"]
    
    # Get accommodation provider
    provider = get_accommodation_provider()
    
    # Search hotels
    hotels = await provider.search(
        destination=constraints["destination"],
        checkin_date=constraints["arrival_date"],
        checkout_date=constraints["departure_date"],
        num_guests=constraints["num_people"]
    )
    
    # Calculate commute times to POI clusters
    poi_cluster_center = calculate_cluster_center(pois)
    for hotel in hotels:
        hotel.commute_time = await calculate_commute(
            hotel.location, poi_cluster_center
        )
    
    # Score and rank
    scored_hotels = score_hotels(hotels, constraints)
    
    return {
        "available_hotels": scored_hotels[:10],  # Top 10
        "accommodation_summary": f"Found {len(hotels)} hotels..."
    }
```

---

### **Week 5: SerpAPI Price Intelligence Layer**

**Goals:**
- Add SerpAPI as secondary source for price comparison
- Async price intelligence (not user-facing)

**Tasks:**
1. Create `SerpAPIHotelProvider`
2. Implement async price collector:
   - Runs nightly for popular destinations
   - Stores historical price data in database
   - Compares Amadeus prices vs market average
3. Add price percentile to hotel scoring
4. Dashboard endpoint for price trends

**Use Case:**
- **NOT for primary search** (too expensive)
- **FOR price intelligence:**
  - "This hotel is 15% below market average"
  - Historical price charts
  - "Price dropped 20% in last 7 days"

**Implementation:**
```python
# backend/app/services/price_intelligence.py
class PriceIntelligenceService:
    async def collect_market_prices(self, destination: str):
        """
        Async job: Run nightly for top 50 destinations
        """
        serpapi = SerpAPIHotelProvider()
        hotels = await serpapi.search(destination, ...)
        
        # Store in DB for historical comparison
        await self.db.save_price_snapshot(hotels)
    
    async def get_price_percentile(self, hotel_id: str, current_price: float):
        """
        Compare current price to 30-day historical data
        """
        history = await self.db.get_price_history(hotel_id, days=30)
        percentile = calculate_percentile(current_price, history)
        return {
            "percentile": percentile,  # e.g., 25 (cheaper than 75% of history)
            "avg_price": mean(history),
            "trend": "down" if percentile < 50 else "up"
        }
```

**Cost Control:**
- Limit to 50 popular destinations
- 1 search/day/destination = 50 searches/day = 1,500/month
- Cost: $75/month (SerpAPI $50 plan)

---

### **Week 6: Testing, Optimization & Documentation**

**Goals:**
- End-to-end testing
- Performance optimization
- Documentation

**Tasks:**
1. **End-to-End Tests:**
   - Test complete workflow: Intake → Discovery → Accommodation → Transport → Optimizer
   - Test 5 cities: Paris, NYC, Tokyo, Barcelona, London
   - Validate: API costs, response times, data quality

2. **Performance Optimization:**
   - Implement parallel API calls (batch processing TODO)
   - Optimize caching TTLs
   - Add request deduplication

3. **Cost Optimization:**
   - Monitor Amadeus free tier usage
   - Implement smart caching to reduce API calls
   - Add cost alerts (when approaching $100/day)

4. **Documentation:**
   - API provider switching guide
   - Cost monitoring dashboard
   - Troubleshooting guide

5. **Apply for Partnerships:**
   - **Skyscanner:** Submit application for Flight API access
   - **Busbud:** Fill partnership inquiry form
   - **Expedia:** (Future) Apply for Rapid API partnership

---

## Part 4: Database Schema Updates

### 4.1 New Tables

```sql
-- backend/alembic/versions/002_accommodation_transport.py

-- Accommodation options
CREATE TABLE accommodations (
    id UUID PRIMARY KEY,
    trip_id UUID REFERENCES trips(id),
    provider VARCHAR(50) NOT NULL,  -- "amadeus", "serpapi"
    provider_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    price_per_night FLOAT NOT NULL,
    currency VARCHAR(10) NOT NULL,
    rating FLOAT,
    review_count INT,
    photo_url TEXT,
    amenities JSONB,
    cancellation_policy TEXT,
    avg_commute_time_minutes INT,  -- To POI cluster
    ai_score FLOAT,
    selected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    raw_data JSONB
);

-- Flight options
CREATE TABLE flights (
    id UUID PRIMARY KEY,
    trip_id UUID REFERENCES trips(id),
    provider VARCHAR(50) NOT NULL,
    provider_id VARCHAR(255) NOT NULL,
    origin VARCHAR(10) NOT NULL,  -- Airport code
    destination VARCHAR(10) NOT NULL,
    departure_datetime TIMESTAMP NOT NULL,
    arrival_datetime TIMESTAMP NOT NULL,
    duration_minutes INT NOT NULL,
    price FLOAT NOT NULL,
    currency VARCHAR(10) NOT NULL,
    airline VARCHAR(100) NOT NULL,
    flight_number VARCHAR(20),
    stops INT DEFAULT 0,
    co2_emissions_kg FLOAT,
    ai_score FLOAT,
    selected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    raw_data JSONB
);

-- Price intelligence (historical data)
CREATE TABLE price_snapshots (
    id UUID PRIMARY KEY,
    destination VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    provider_id VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,  -- "hotel", "flight"
    price FLOAT NOT NULL,
    currency VARCHAR(10) NOT NULL,
    snapshot_date DATE NOT NULL,
    raw_data JSONB,
    UNIQUE(provider_id, snapshot_date)
);

CREATE INDEX idx_price_snapshots_lookup 
    ON price_snapshots(provider_id, entity_type, snapshot_date DESC);
```

### 4.2 State Model Updates

```python
# backend/app/models/state.py (additions)

class Hotel(TypedDict, total=False):
    """Accommodation option"""
    provider: str
    provider_id: str
    name: str
    latitude: float
    longitude: float
    price_per_night: float
    currency: str
    rating: Optional[float]
    review_count: Optional[int]
    photo_url: Optional[str]
    amenities: list[str]
    cancellation_policy: Optional[str]
    avg_commute_time_minutes: Optional[int]
    ai_score: Optional[float]

class Flight(TypedDict, total=False):
    """Flight option"""
    provider: str
    provider_id: str
    origin: str
    destination: str
    departure_datetime: str
    arrival_datetime: str
    duration_minutes: int
    price: float
    currency: str
    airline: str
    flight_number: Optional[str]
    stops: int
    co2_emissions_kg: Optional[float]
    ai_score: Optional[float]

class TravelAgentState(TypedDict, total=False):
    # Existing fields...
    
    # NEW: Accommodation
    available_hotels: list[Hotel]
    selected_hotel: Optional[Hotel]
    accommodation_summary: Optional[str]
    
    # NEW: Transport
    available_flights: list[Flight]
    selected_flight_outbound: Optional[Flight]
    selected_flight_return: Optional[Flight]
    transport_summary: Optional[str]
```

---

## Part 5: API Endpoints (New)

```python
# backend/app/api/routes_v2.py (additions)

@router_v2.get("/trips/{trip_id}/accommodations")
async def get_accommodations(
    trip_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Get accommodation options for a trip.
    Triggers AccommodationAgent if not already run.
    """
    pass

@router_v2.post("/trips/{trip_id}/accommodations/{accommodation_id}/select")
async def select_accommodation(
    trip_id: str,
    accommodation_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Mark an accommodation as selected.
    Recalculates commute times for itinerary.
    """
    pass

@router_v2.get("/trips/{trip_id}/flights")
async def get_flights(
    trip_id: str,
    origin: str,  # Airport code or city
    user_id: str = Depends(get_current_user)
):
    """
    Get flight options for arrival/departure.
    """
    pass

@router_v2.post("/trips/{trip_id}/flights/{flight_id}/select")
async def select_flight(
    trip_id: str,
    flight_id: str,
    direction: str,  # "outbound" or "return"
    user_id: str = Depends(get_current_user)
):
    """
    Mark a flight as selected.
    """
    pass

@router_v2.get("/price-intelligence/{destination}")
async def get_price_trends(
    destination: str,
    entity_type: str = "hotel",  # or "flight"
    days: int = 30,
    user_id: str = Depends(get_current_user)
):
    """
    Get historical price trends for destination.
    """
    pass
```

---

## Part 6: Configuration & Secrets

### 6.1 Environment Variables

```bash
# backend/.env (additions)

# Amadeus API (sign up: https://developers.amadeus.com/)
AMADEUS_API_KEY=your_api_key_here
AMADEUS_API_SECRET=your_api_secret_here
AMADEUS_ENVIRONMENT=test  # "test" or "production"

# SerpAPI (sign up: https://serpapi.com/)
SERPAPI_KEY=your_serpapi_key_here  # Optional, for price intelligence

# Skyscanner (apply: https://developers.skyscanner.net/)
SKYSCANNER_API_KEY=your_key_here  # Optional, when approved

# Busbud (apply: https://www.busbud.com/en/partnership)
BUSBUD_API_KEY=your_key_here  # Optional, when approved

# Provider selection
ACCOMMODATION_PROVIDER=amadeus  # "amadeus" | "serpapi" | "aggregator"
FLIGHT_PROVIDER=amadeus  # "amadeus" | "skyscanner"
ROUTE_PROVIDER=google_maps  # Already exists
```

### 6.2 Amadeus Setup Steps

1. **Sign up:** https://developers.amadeus.com/register
2. **Create app:** "Travel Planning Agent"
3. **Get credentials:** API Key + API Secret
4. **Test environment:**
   - Free tier: 3,000 Hotel Search calls/month
   - Free tier: 2,000 Flight Search calls/month
   - Static data (not real-time pricing)
5. **Production environment:**
   - Pay-as-you-go after free tier
   - Real-time pricing
   - Request rate limit increase if needed

---

## Part 7: Testing Strategy

### 7.1 Unit Tests

```python
# backend/tests/test_amadeus_hotel_provider.py
@pytest.mark.asyncio
async def test_amadeus_hotel_search():
    provider = AmadeusHotelProvider(mock_client)
    hotels = await provider.search(
        destination="Paris",
        checkin_date=date(2025, 11, 1),
        checkout_date=date(2025, 11, 5),
        num_guests=2
    )
    assert len(hotels) > 0
    assert hotels[0].price > 0
    assert hotels[0].latitude != 0

# backend/tests/test_accommodation_agent.py
@pytest.mark.asyncio
async def test_accommodation_agent():
    state = {
        "constraints": {...},
        "potential_pois": [...]
    }
    result = await accommodation_agent(state)
    assert "available_hotels" in result
    assert len(result["available_hotels"]) <= 10
```

### 7.2 Integration Tests

```python
# backend/tests/integration/test_amadeus_real_api.py
@pytest.mark.integration
@pytest.mark.asyncio
async def test_real_amadeus_hotel_search():
    """
    Integration test with real Amadeus API (test environment)
    Uses free tier quota.
    """
    provider = AmadeusHotelProvider(
        client_id=os.getenv("AMADEUS_API_KEY"),
        client_secret=os.getenv("AMADEUS_API_SECRET"),
        environment="test"
    )
    
    hotels = await provider.search(
        destination="NYC",
        checkin_date=date.today() + timedelta(days=30),
        checkout_date=date.today() + timedelta(days=33),
        num_guests=2
    )
    
    assert len(hotels) > 0, "Should find hotels in NYC"
    assert hotels[0].price > 0, "Should have valid pricing"
    
    # Check data quality
    for hotel in hotels[:5]:
        assert hotel.name, "Hotel should have name"
        assert hotel.latitude and hotel.longitude, "Should have coordinates"
        assert hotel.currency == "USD", "NYC hotels should be in USD"
```

### 7.3 End-to-End Test

```python
# backend/test_phase2_3_end_to_end.py
async def test_complete_trip_with_accommodation_and_transport():
    """
    Test: Paris 5-day trip with:
    - 30 POIs discovered
    - 10 hotels recommended
    - 5 flights (CDG arrival/departure)
    - Optimized itinerary
    """
    # 1. Intake
    constraints = {...}
    
    # 2. Discovery
    pois = await discovery_agent(constraints)
    assert len(pois) >= 20
    
    # 3. Accommodation
    hotels = await accommodation_agent({
        "constraints": constraints,
        "potential_pois": pois
    })
    assert len(hotels["available_hotels"]) == 10
    assert hotels["available_hotels"][0]["avg_commute_time_minutes"] < 30
    
    # 4. Transport
    flights = await transport_agent({
        "constraints": constraints
    })
    assert len(flights["available_flights"]) > 0
    
    # 5. Optimizer (with selected hotel location)
    selected_hotel = hotels["available_hotels"][0]
    itinerary = await optimizer_agent({
        "potential_pois": pois[:8],
        "constraints": constraints,
        "selected_hotel": selected_hotel
    })
    assert len(itinerary["itinerary"]) > 0
```

---

## Part 8: Cost Monitoring & Alerts

### 8.1 Cost Tracking Enhancement

```python
# backend/app/services/cost_tracker.py (update)

# Add new service/endpoint mappings
PRICING = {
    # Existing...
    "amadeus": {
        "hotel_search": 0.0025,  # $0.0025 per call
        "flight_search": 0.0055,  # $0.0055 per call
        "hotel_details": 0.0025,
        "flight_price": 0.0055,
    },
    "serpapi": {
        "hotel_search": 0.05,  # Estimated based on $50/month for 1K searches
    },
    "skyscanner": {
        "flight_cached": 0.0,  # Free
        "flight_live": 0.02,  # Estimated
    }
}

# Add alerts
async def check_daily_budget_limit(user_id: str, trip_id: str):
    daily_cost = await get_user_daily_cost(user_id)
    if daily_cost["total_cost"] > 10.0:  # $10/day alarm
        await send_alert(user_id, "Daily API cost exceeded $10")
```

### 8.2 Dashboard Metrics

Add to monitoring endpoints:
```python
@router_monitoring.get("/api/monitoring/provider-performance")
async def get_provider_performance():
    """
    Compare provider performance:
    - Amadeus vs SerpAPI price differences
    - Response times
    - Success rates
    - Cost per successful booking
    """
    pass
```

---

## Part 9: Migration Path from Scraping (If Needed)

### 9.1 If You Started with Apify/Scraping

**Scenario:** You prototyped with Apify Booking Scraper, now migrating to Amadeus.

**Migration Steps:**
1. **Week 1:** Implement Amadeus provider in parallel
2. **Week 2:** A/B test: 50% traffic to Amadeus, 50% to Apify
3. **Week 3:** Compare:
   - Price accuracy
   - Data completeness
   - Response times
   - User satisfaction
4. **Week 4:** Switch to 100% Amadeus if metrics are acceptable
5. **Week 5:** Deprecate Apify, keep as emergency fallback for 1 month
6. **Week 6:** Full removal

**Rollback Plan:**
- Keep Apify provider code for 3 months
- If Amadeus fails (rate limits, pricing issues), instant rollback via config

---

## Part 10: Risk Mitigation

### 10.1 Identified Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Amadeus free tier exhausted** | High | Medium | Monitor usage, implement caching, upgrade to paid |
| **Amadeus published rates too expensive** | Medium | High | Add SerpAPI for price comparison, show "Price Match Guarantee" |
| **Google Maps price increase (March 2025)** | Certain | Medium | Budget $3,250 free credit wisely, apply for Busbud partnership |
| **Skyscanner/Busbud approval denied** | Medium | Low | Use Amadeus exclusively, not critical for MVP |
| **Rate limiting during traffic spike** | Medium | High | Implement request queuing, smart caching, rate limit per user |
| **Legal issues with SerpAPI** | Low | Medium | Use only for price intelligence (not primary search), document compliance |

### 10.2 Contingency Plans

**If Amadeus becomes too expensive:**
- **Option A:** Negotiate enterprise pricing (requires $5K+/month spend)
- **Option B:** Switch to Expedia Rapid API (requires partnership approval, 2-3 month process)
- **Option C:** Hybrid: Amadeus + direct OTA partnerships

**If Google Routes API becomes prohibitive:**
- **Option A:** Build custom GTFS aggregator (high dev cost, $5K-10K)
- **Option B:** License Moovit API (partnership required)
- **Option C:** Use Busbud + regional APIs (Trainline, FlixBus)

---

## Part 11: Success Criteria

### 11.1 Phase 2.3 Completion Checklist

- [ ] **Week 1:** Amadeus Hotel API integrated and tested
- [ ] **Week 2:** Amadeus Flight API integrated and tested
- [ ] **Week 3:** Google Routes API refactored into provider pattern
- [ ] **Week 4:** LangGraph agents created and integrated
- [ ] **Week 5:** SerpAPI price intelligence layer operational
- [ ] **Week 6:** End-to-end tests passing, documentation complete

### 11.2 Key Performance Indicators

| Metric | Target | Measurement |
|--------|--------|-------------|
| **API Response Time** | <2s for accommodation search | Avg p95 latency |
| **Cost per Trip** | <$0.10 | Amadeus + Google costs |
| **Data Quality** | >95% complete fields | % of hotels with all required fields |
| **Cache Hit Rate** | >70% | Redis cache hits / total requests |
| **Success Rate** | >99% | API calls returning valid data |
| **User Satisfaction** | >4.5/5 | Feedback on accommodation recommendations |

### 11.3 Go/No-Go Decision Points

**After Week 2 (Amadeus integration):**
- ✅ GO if: API costs <$1/trip, response times <3s, data quality >90%
- ❌ NO-GO if: Costs >$2/trip → investigate alternatives (Expedia, scraping)

**After Week 4 (Agent integration):**
- ✅ GO if: End-to-end workflow completes in <10s, agent scoring produces sensible rankings
- ❌ NO-GO if: Integration failures, scoring algorithm needs redesign

**After Week 6 (Full testing):**
- ✅ LAUNCH if: All tests pass, cost projections acceptable, no critical bugs
- ❌ DELAY if: Major issues discovered, need additional optimization

---

## Part 12: Next Steps (Now)

### Immediate Actions (This Week)

1. **Sign up for Amadeus:** https://developers.amadeus.com/register
   - Get API Key + Secret
   - Test authentication flow

2. **Apply for Skyscanner:** https://developers.skyscanner.net/
   - Fill application form
   - Expected wait time: 1-2 weeks

3. **Apply for Busbud:** https://www.busbud.com/en/partnership
   - Fill partnership inquiry form
   - Expected wait time: 2-4 weeks

4. **Update .env template:**
   ```bash
   cp backend/.env backend/.env.example
   # Document new variables
   ```

5. **Create implementation branch:**
   ```bash
   git checkout -b phase-2.3-accommodation-transport
   ```

6. **Set up project tracking:**
   - Create GitHub project board
   - Add issues for each week's tasks
   - Assign to team members

---

## Summary: Why This Plan Works

✅ **Legally compliant:** Amadeus APIs are official, no TOS violations  
✅ **Cost-effective:** $0.06 per trip vs $0.50+ with scraping infrastructure  
✅ **Scalable:** Pay-as-you-go model grows with usage  
✅ **Maintainable:** Official APIs are stable, no scraper breakage  
✅ **Flexible:** Swappable provider pattern allows easy migration  
✅ **Production-ready:** 24/7 support, SLAs, booking integration  

**Total Investment:**
- **Time:** 6 weeks (1 developer full-time)
- **Cost:** $200-500/month (MVP) → $500-1,000/month (10K trips)
- **Risk:** Low (using official APIs, clear fallback options)

**Expected Outcome:**
- Users can search hotels and flights
- Agents recommend accommodations near POIs
- Optimized itineraries include commute times
- Price intelligence layer provides market context
- Full end-to-end trip planning experience

---

**Ready to start implementation? Begin with Week 1: Amadeus Hotel API Integration.**



