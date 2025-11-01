# Phase 2.3 Research Prompt: Accommodation & Transport Data Sources

## OBJECTIVE
Find the best data sources (APIs, scraping targets, or aggregators) for **accommodation search** and **multi-modal transport options** (flights, trains, local transit) to enable intelligent travel planning.

---

## PART 1: ACCOMMODATION DATA SOURCES

### Primary Research Questions

1. **Official Booking APIs**
   - Which platforms offer **public search/booking APIs** (not just property management APIs)?
   - Examples to investigate:
     - Booking.com Partner API
     - Airbnb API (status after shutdown?)
     - Hotels.com / Expedia Partner Central
     - Agoda Affiliate API
     - Hostelworld API
   
2. **Third-Party Aggregator APIs**
   - Search: "hotel booking API", "accommodation API aggregator", "OTA API"
   - Specific services to research:
     - **Amadeus Self-Service APIs** (Hotel Search API)
     - **RapidAPI Marketplace**: Search "booking", "hotel", "airbnb"
     - **SerpAPI**: Google Hotels scraping service
     - **Apify**: Pre-built Booking.com/Airbnb scrapers
     - **ScraperAPI / Bright Data**: Managed scraping infrastructure
     - **Skyscanner Hotels API**
     - **Travelpayouts API** (affiliate network)

3. **Web Scraping Feasibility** (Fallback Option)
   - **Booking.com**:
     - Current DOM structure & CSS selectors (2024-2025)
     - JavaScript rendering requirements (SSR vs CSR)
     - CAPTCHA presence & bypass strategies
     - Rate limiting behavior
     - Legal status (review ToS § Automated Access)
   - **Airbnb**:
     - Public API status (officially shut down in 2024)
     - Scraping difficulty (heavy JS, anti-bot measures)
     - Legal precedent (hiQ Labs v. LinkedIn case)
   - **Agoda / Hotels.com**:
     - Similar analysis

4. **Required Data Fields**
   - **Must-Have**:
     - Name, address, price (per night)
     - Location (lat/lng for mapping)
     - Availability for specific dates
     - Rating & review count
   - **Nice-to-Have**:
     - Photos (URLs)
     - Amenities (WiFi, parking, breakfast)
     - Review snippets
     - Cancellation policy
     - Distance to city center
   - **Computed**:
     - Commute time to POI clusters (using Google Routes API)
     - Price percentile for destination

### Investigation Checklist

For each source, document:

| Criterion | Details |
|-----------|---------|
| **API Name** | Official name & provider |
| **Access Type** | Public API / Affiliate / Scraping |
| **Pricing** | Free tier? Cost per request/month? |
| **Rate Limits** | Requests per second/day |
| **Authentication** | API key, OAuth, IP whitelist? |
| **Python SDK** | Official library available? |
| **Documentation Quality** | 1-5 rating |
| **Data Freshness** | Real-time / Daily / Weekly? |
| **Geographic Coverage** | Global / Regional? |
| **Legal Status** | ToS compliance, commercial use? |
| **Setup Complexity** | Easy / Medium / Hard |

---

## PART 2: FLIGHT DATA SOURCES

### Research Targets

1. **Flight Search APIs**
   - **Google Flights**: Check if QPX Express API is still available (deprecated?)
   - **Amadeus Flight Offers Search API** (recommended)
   - **Skyscanner Flight Search API**
   - **Kiwi.com Tequila API** (multi-city, flexible dates)
   - **RapidAPI**: "flight", "airline" search
   - **Aviationstack** (real-time flight tracking)
   - **FlightAPI.io**

2. **Required Features**
   - **Search Capabilities**:
     - Origin/destination city or airport code
     - Date range search (±3 days flexibility)
     - Multi-city / round-trip support
     - Cabin class filter
   - **Response Data**:
     - Price (multiple currencies)
     - Flight duration
     - Airline & flight number
     - Layovers & airports
     - Departure/arrival times
   - **Bonus Features**:
     - Price history / predictions
     - Carbon emissions data
     - Alternative nearby airports
     - Baggage policies

3. **Comparison Criteria**
   - Price accuracy vs. actual booking sites
   - Update frequency (how stale is the data?)
   - Coverage (which airlines/alliances?)
   - Deep-link quality (can we send user to book?)

---

## PART 3: TRAIN & BUS DATA SOURCES

### Rail APIs

1. **Multi-Country Aggregators**
   - **Omio API** (formerly GoEuro) - Europe, US, Canada
   - **Trainline Partner API** - UK & Europe
   - **Rail Europe API** - European rail passes
   - **Rome2rio API** - Multi-modal route planner

2. **Regional Rail APIs**
   - **North America**:
     - Amtrak API
     - VIA Rail (Canada)
   - **Europe**:
     - Deutsche Bahn (Germany)
     - SNCF Connect (France)
     - Trenitalia (Italy)
     - Renfe (Spain)
   - **Asia**:
     - JR East (Japan)
     - IRCTC (India)

### Bus APIs

1. **Providers**
   - **FlixBus / Greyhound API**
   - **Busbud API** (aggregator)
   - **Megabus / BoltBus** (check API availability)

2. **Required Data**
   - Route (origin → destination)
   - Departure/arrival times
   - Duration
   - Price
   - Operator name
   - Seat availability

---

## PART 4: LOCAL TRANSIT & MULTI-MODAL ROUTING

### Google Maps Platform

1. **Verify Capabilities**
   - **Transit API**:
     - Real-time schedules
     - Fare information
     - Transit passes (day/week passes)
     - Multiple route options
   - **Directions API** (transit mode):
     - Walking + public transit combinations
     - Transfer details

2. **Limitations**
   - Coverage gaps in smaller cities?
   - Real-time vs. scheduled data

### City-Specific APIs

1. **Open Transit Data (GTFS)**
   - **What**: General Transit Feed Specification
   - **Where**: Many cities publish GTFS feeds
   - **Examples**:
     - Transport for London (TfL) API
     - NYC MTA API
     - Paris RATP API
     - Bay Area 511 API

2. **Multi-Modal Aggregators**
   - **Citymapper API** (check developer access)
   - **Moovit API**
   - **Transit App** (check API availability)

---

## PART 5: ARCHITECTURAL DESIGN PATTERN

### Swappable Provider Interface

Implement an **Abstract Base Class** for each data type to allow easy swapping:

```python
from abc import ABC, abstractmethod
from typing import List, Dict, Optional
from datetime import date

# ACCOMMODATION
class AccommodationProvider(ABC):
    @abstractmethod
    async def search(
        self,
        destination: str,
        checkin: date,
        checkout: date,
        guests: int,
        **filters
    ) -> List[Dict]:
        """Return list of accommodation options."""
        pass

class BookingComScraper(AccommodationProvider):
    """Initial scraping implementation."""
    async def search(self, ...):
        # Web scraping logic
        pass

class AmadeusHotelAPI(AccommodationProvider):
    """Production API implementation."""
    async def search(self, ...):
        # Amadeus API call
        pass

# FLIGHTS
class FlightProvider(ABC):
    @abstractmethod
    async def search(
        self,
        origin: str,
        destination: str,
        departure_date: date,
        return_date: Optional[date] = None,
        **filters
    ) -> List[Dict]:
        pass

class AmadeusFlightAPI(FlightProvider):
    pass

class KiwiFlightAPI(FlightProvider):
    pass

# TRANSPORT
class TransportProvider(ABC):
    @abstractmethod
    async def get_routes(
        self,
        origin: str,
        destination: str,
        departure_date: date,
        modes: List[str]  # ["train", "bus", "flight"]
    ) -> List[Dict]:
        pass

class Rome2rioAPI(TransportProvider):
    """Multi-modal route planner."""
    pass
```

### Configuration-Driven Selection

```python
# app/config.py
class Settings:
    accommodation_provider: str = "amadeus"  # or "booking_scraper"
    flight_provider: str = "amadeus"
    transport_provider: str = "rome2rio"
    
    # API keys
    amadeus_api_key: str
    kiwi_api_key: str
    # ...
```

---

## PART 6: DECISION MATRIX

### Criteria for Selection

| Factor | Weight | Scoring Method |
|--------|--------|----------------|
| **Cost** | 30% | Free tier > Pay-per-use > Subscription |
| **Data Quality** | 25% | Accuracy, freshness, completeness |
| **Ease of Integration** | 20% | Python SDK, docs, examples |
| **Legal Safety** | 15% | Official API > Affiliate > Scraping |
| **Maintenance Burden** | 10% | Stable API > Frequently changing |

### Scoring Example

```
Booking.com Scraper:
  Cost: 10/10 (free)
  Quality: 9/10 (direct from source)
  Integration: 5/10 (complex, brittle)
  Legal: 3/10 (ToS violation risk)
  Maintenance: 2/10 (breaks frequently)
  → Total: 6.2/10

Amadeus Hotel API:
  Cost: 7/10 (free tier: 2K calls/month)
  Quality: 8/10 (aggregated data)
  Integration: 9/10 (Python SDK, good docs)
  Legal: 10/10 (official API)
  Maintenance: 10/10 (stable)
  → Total: 8.6/10
```

---

## DELIVERABLES EXPECTED FROM RESEARCH

### 1. **Recommendation Table**

| Data Type | **Top Choice** | **Backup Option** | Justification |
|-----------|---------------|-------------------|---------------|
| Accommodations | Amadeus Hotel API | Booking.com scraper | Best free tier, stable |
| Flights | Kiwi.com Tequila API | Amadeus Flights | Better multi-city support |
| Trains/Buses | Rome2rio API | Regional APIs | Multi-modal coverage |
| Local Transit | Google Transit API | City GTFS feeds | Best coverage |

### 2. **Cost Estimate Per Trip**

Calculate expected API costs for a typical 5-day trip:
- 10 accommodation searches → $X
- 2 flight searches → $Y
- 5 route calculations → $Z
- **Total per trip: $A.BC**

### 3. **Implementation Complexity Ranking**

Rate each integration:
- **Easy** (1-2 days): Google Transit, Rome2rio
- **Medium** (3-5 days): Amadeus APIs, Kiwi.com
- **Hard** (1-2 weeks): Web scraping with Selenium/Playwright

### 4. **Code Examples / SDK Links**

For top 3 choices, provide:
- Official documentation URL
- Python SDK installation command
- Minimal "Hello World" code snippet
- Rate limits & pricing page link

### 5. **Legal & Compliance Summary**

For scraping options:
- ToS excerpt allowing/prohibiting automated access
- Known legal cases (e.g., hiQ v. LinkedIn precedent)
- Risk assessment: Low / Medium / High

### 6. **Mock Response Schemas**

For top APIs, document the JSON structure:

```json
// Amadeus Hotel Search Response (example)
{
  "data": [
    {
      "type": "hotel-offers",
      "hotel": {
        "name": "Hotel Example",
        "latitude": 48.8584,
        "longitude": 2.2945
      },
      "offers": [
        {
          "price": {
            "currency": "USD",
            "total": "150.00"
          },
          "room": {
            "type": "DOUBLE"
          }
        }
      ]
    }
  ]
}
```

---

## RESEARCH TOOLS & RESOURCES

### Where to Search

1. **API Marketplaces**:
   - RapidAPI: https://rapidapi.com/
   - APILayer: https://apilayer.com/
   - ProgrammableWeb: API directory

2. **Documentation Portals**:
   - Amadeus for Developers: https://developers.amadeus.com/
   - Skyscanner Partners: https://partners.skyscanner.net/
   - Rome2rio API: https://www.rome2rio.com/api/

3. **Developer Communities**:
   - Stack Overflow: Search "hotel booking API python"
   - Reddit: r/webdev, r/Python
   - GitHub: Search "booking scraper", "flight API"

4. **Legal Research**:
   - Case Law: hiQ Labs, Inc. v. LinkedIn Corporation
   - ToS Review: Use web.archive.org for historical ToS

### Testing Methodology

For each API:
1. **Sign up** for free tier (if available)
2. **Run test query** with Python requests/SDK
3. **Measure**:
   - Response time (latency)
   - Data completeness (% of fields populated)
   - Error rate
4. **Compare** with direct website data for accuracy

---

## PHASE 2.3 SUCCESS CRITERIA

Research is complete when we have:

✅ **Top 3 accommodation sources** with decision matrix scores
✅ **Top 2 flight APIs** with pricing comparison  
✅ **Best multi-modal transport API** identified  
✅ **Scraping vs. API decision** documented per data type  
✅ **Total cost estimate** per trip calculated  
✅ **Legal risk assessment** for all scraping options  
✅ **Python code examples** ready for integration  
✅ **Provider interface design** finalized (ABC classes)  

---

## TIMELINE ESTIMATE

- **Accommodation APIs**: 4-6 hours (testing 3-5 sources)
- **Flight APIs**: 3-4 hours (testing 2-3 sources)
- **Transport/Transit APIs**: 3-4 hours  
- **Legal/ToS review**: 2 hours  
- **Documentation & comparison**: 2 hours  
- **Total**: 14-18 hours research time

---

## NEXT STEPS AFTER RESEARCH

1. **Create Provider Implementations**: Implement ABC classes for top 2-3 choices
2. **Add Configuration**: Update `app/config.py` with new API keys
3. **Create Agent Nodes**: `AccommodationAgent`, `TransportAgent`
4. **Integrate with Graph**: Add to LangGraph workflow after Discovery
5. **Write Tests**: Unit tests with mocked responses, integration tests with real APIs (rate-limited)

---

**Start Research Now** → Focus on Amadeus APIs first (most comprehensive free tier)



