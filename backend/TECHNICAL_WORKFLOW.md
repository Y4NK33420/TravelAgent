# Phase 2 Technical Workflow Documentation
## Complete Data Flow, Agent Roles, and System Architecture

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Complete Data Flow](#complete-data-flow)
3. [Agent Deep Dive](#agent-deep-dive)
4. [Optimizer Technical Details](#optimizer-technical-details)
5. [State Management](#state-management)
6. [API Integrations](#api-integrations)
7. [Real Example Walkthrough](#real-example-walkthrough)

---

## System Overview

### Architecture Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INPUT                               │
│  "I want to visit Tokyo. Love temples and modern architecture"  │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LANGGRAPH WORKFLOW                            │
│                                                                   │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐   │
│  │   INTAKE    │───▶│  DISCOVERY   │───▶│   OPTIMIZER     │   │
│  │   AGENT     │    │    AGENT     │    │     AGENT       │   │
│  └─────────────┘    └──────────────┘    └─────────────────┘   │
│        │                   │                      │              │
│        ▼                   ▼                      ▼              │
│  Extract              Find & Score          Optimize Route      │
│  Constraints          POIs                  + Schedule          │
└─────────────────────────────────────────────────────────────────┘
                     │
                     ▼
         ┌──────────────────────────┐
         │   EXTERNAL SERVICES      │
         ├──────────────────────────┤
         │ • Google Maps Geocoding  │
         │ • Google Places API      │
         │ • Distance Matrix API    │
         │ • Google Gemini LLM      │
         │ • OR-Tools Solver        │
         └──────────────────────────┘
```

---

## Complete Data Flow

### End-to-End Request Flow

#### **Step 1: User Input** 
```python
Input: HumanMessage(
    content="I want to visit Tokyo. I love temples and modern architecture."
)
```

#### **Step 2: Intake Agent Processing**

**Input:**
- User's natural language message
- No prior state

**Process:**
1. **LLM Call (Gemini)**:
   ```python
   System Prompt: "Extract structured trip constraints from this message"
   User Message: "I want to visit Tokyo..."
   
   Gemini Response: {
       "destination": "Tokyo, Japan",
       "interests": ["temples", "modern architecture"],
       "budget": "moderate",  # inferred
       "vibe": "cultural"     # inferred
   }
   ```

2. **Geocoding (Google Maps)**:
   ```python
   Request: geocode("Tokyo, Japan")
   Response: {
       "lat": 35.6762,
       "lng": 139.6503,
       "formatted_address": "Tokyo, Japan"
   }
   ```

**Output State Update:**
```python
{
    "constraints": {
        "destination": "Tokyo, Japan",
        "budget": "moderate",
        "vibe": "cultural",
        "must_see": ["temples", "modern architecture"]
    },
    "destination_coords": {
        "lat": 35.6762,
        "lng": 139.6503
    },
    "current_stage": "intake_complete"
}
```

#### **Step 3: Discovery Agent Processing**

**Input State:**
- `constraints`: Trip requirements
- `destination_coords`: Geocoded location

**Process:**

**3A. Interest-Based POI Search (Google Places API)**

For each interest category:
```python
# Category 1: "temples"
Request: places.nearby_search(
    location=(35.6762, 139.6503),
    radius=5000,  # 5km
    type='place_of_worship'
)

Response: [
    {
        "place_id": "ChIJ...",
        "name": "Meiji Jingu",
        "geometry": {"location": {"lat": 35.6764, "lng": 139.6993}},
        "rating": 4.5,
        "user_ratings_total": 45000,
        "types": ["place_of_worship", "tourist_attraction"],
        "price_level": 0
    },
    {
        "place_id": "ChIJ...",
        "name": "Senso-ji Temple",
        "geometry": {"location": {"lat": 35.7148, "lng": 139.7967}},
        "rating": 4.4,
        "user_ratings_total": 89000,
        "price_level": 0
    },
    # ... more temples
]

# Category 2: "modern architecture"
Request: places.nearby_search(
    location=(35.6762, 139.6503),
    radius=5000,
    keyword='modern architecture'
)

Response: [
    {
        "place_id": "ChIJ...",
        "name": "Tokyo Tower",
        "geometry": {"location": {"lat": 35.6586, "lng": 139.7454}},
        "rating": 4.3,
        "user_ratings_total": 125000,
        "price_level": 2
    },
    # ... more modern buildings
]
```

**3B. POI Enrichment (Google Places Details API)**

For each discovered POI:
```python
Request: places.place_details(
    place_id="ChIJ...",
    fields=['name', 'formatted_address', 'opening_hours', 'website', 
            'rating', 'reviews', 'photos', 'price_level']
)

Response: {
    "name": "Meiji Jingu",
    "formatted_address": "1-1 Yoyogi-kamizono-cho, Shibuya-ku, Tokyo",
    "opening_hours": {
        "open_now": true,
        "weekday_text": ["Monday: 6:00 AM – 6:00 PM", ...]
    },
    "rating": 4.5,
    "user_ratings_total": 45000,
    "price_level": 0,
    "reviews": [
        {"text": "Beautiful shrine...", "rating": 5},
        ...
    ],
    "photos": [...]
}
```

**3C. AI Scoring (Custom Algorithm)**

For each POI:
```python
# Quality Score (40% weight)
quality_score = (poi['rating'] / 5.0) * 100  # 4.5 -> 90.0

# Popularity Score (30% weight)
if reviews >= 5000:
    popularity_score = 100.0  # Meiji has 45k -> 100
elif reviews >= 1000:
    popularity_score = 90.0
# ... etc

# Price Fit Score (30% weight)
# User budget: "moderate"
# POI price: 0 (free)
price_fit_score = 85.0  # Good match for moderate budget

# Weighted Average
ai_score = (quality_score * 0.4) + 
           (popularity_score * 0.3) + 
           (price_fit_score * 0.3)
         = (90 * 0.4) + (100 * 0.3) + (85 * 0.3)
         = 36 + 30 + 25.5
         = 91.5
```

**3D. Must-See Filtering**

```python
# User specified must-see: ["temples", "modern architecture"]
# Boost POIs matching these interests
for poi in pois:
    if "temple" in poi['name'].lower() or "shrine" in poi['name'].lower():
        poi['ai_score'] += 5  # Boost temples
    if "tower" in poi['name'].lower() or "building" in poi['name'].lower():
        poi['ai_score'] += 5  # Boost modern architecture

# Sort by AI score
pois.sort(key=lambda x: x['ai_score'], reverse=True)
```

**Output State Update:**
```python
{
    "potential_pois": [
        {
            "place_id": "ChIJ...",
            "name": "Meiji Jingu",
            "geometry": {"location": {"lat": 35.6764, "lng": 139.6993}},
            "rating": 4.5,
            "user_ratings_total": 45000,
            "ai_score": 96.5,  # Boosted for "temple" match
            "score_breakdown": {
                "quality": 90.0,
                "popularity": 100.0,
                "price_fit": 85.0
            },
            "recommendation_reason": "Highly rated shrine with 45,000 reviews..."
        },
        # ... 29 more POIs (top 30 kept)
    ],
    "current_stage": "discovery_complete"
}
```

#### **Step 4: Optimizer Agent Processing**

**Input State:**
- `potential_pois`: 30 scored POIs
- `destination_coords`: Starting point
- `optimization_params`: Day hours, travel mode, etc.

**Process:**

**4A. POI Preparation**
```python
# Limit to top 8 POIs (API constraints: 9x9 = 81 < 100 element limit)
top_pois = potential_pois[:8]

# Add starting point as first POI
pois_for_optimizer = [
    {
        "name": "Starting Point",
        "poi_id": "start",
        "location": {"lat": 35.6762, "lng": 139.6503},
        "time_to_visit_minutes": 0  # No time at starting point
    },
    {
        "name": "Meiji Jingu",
        "poi_id": "ChIJ...",
        "location": {"lat": 35.6764, "lng": 139.6993},
        "time_to_visit_minutes": 60,  # Estimated 1 hour visit
        "opening_time": None,  # Open all day
        "closing_time": None
    },
    # ... 7 more POIs
]
```

**4B. Travel Time Matrix Calculation (Google Distance Matrix API)**

```python
Request: distance_matrix(
    origins=[
        (35.6762, 139.6503),  # Start
        (35.6764, 139.6993),  # Meiji
        (35.7148, 139.7967),  # Senso-ji
        # ... 6 more locations
    ],
    destinations=[same 9 locations],
    mode='walking'
)

Response: {
    "rows": [
        {  # From Starting Point
            "elements": [
                {"duration": {"value": 0}},      # to self
                {"duration": {"value": 1380}},   # to Meiji (23min)
                {"duration": {"value": 8820}},   # to Senso-ji (147min)
                # ... to other 6 POIs
            ]
        },
        {  # From Meiji
            "elements": [
                {"duration": {"value": 1380}},   # to Start
                {"duration": {"value": 0}},      # to self
                {"duration": {"value": 7440}},   # to Senso-ji (124min)
                # ...
            ]
        },
        # ... 7 more rows
    ]
}

# Extract into simple matrix
travel_matrix = [
    [0,    1380, 8820, 5400, 3600, 2700, 4200, 3900, 4500],  # From Start
    [1380, 0,    7440, 4020, 2220, 1320, 2820, 2520, 3120],  # From Meiji
    [8820, 7440, 0,    3600, 5220, 6120, 4620, 4920, 4320],  # From Senso-ji
    # ... 6 more rows
]  # All values in seconds
```

**4C. OR-Tools VRPTW Optimization**

```python
# Input Data Model
data = {
    "time_matrix": travel_matrix,  # 9x9 matrix
    "service_times": [0, 3600, 3600, 3600, ...],  # Visit duration (seconds)
    "time_windows": [
        (32400, 79200),  # Start: 9am-10pm
        (32400, 79200),  # Meiji: 9am-10pm (open all day)
        (28800, 68400),  # Senso-ji: 8am-7pm (actual hours)
        # ... 6 more time windows
    ],
    "num_vehicles": 1,  # Single traveler
    "depot": 0  # Start/end at index 0
}

# OR-Tools Solver Process:
# 1. Create routing model
manager = pywrapcp.RoutingIndexManager(9, 1, 0)
routing = pywrapcp.RoutingModel(manager)

# 2. Define cost function (minimize travel time)
def time_callback(from_idx, to_idx):
    from_node = manager.IndexToNode(from_idx)
    to_node = manager.IndexToNode(to_idx)
    return time_matrix[from_node][to_node] + service_times[from_node]

# 3. Add time dimension with constraints
routing.AddDimension(
    transit_callback_index,
    slack_max=1800,  # 30min slack allowed
    capacity=86400,  # Max 24 hours
    fix_start_cumul_to_zero=False,
    dimension_name='Time'
)

# 4. Add time window constraints
for location_idx, time_window in enumerate(time_windows):
    index = manager.NodeToIndex(location_idx)
    time_dimension.CumulVar(index).SetRange(time_window[0], time_window[1])

# 5. Solve with PATH_CHEAPEST_ARC strategy
solution = routing.SolveWithParameters(search_parameters)

# Solution Output:
optimized_route = [
    0,  # Start
    1,  # Meiji Jingu (closest to start)
    4,  # Hachiko Statue (nearby)
    3,  # Tokyo Tower
    2,  # Senso-ji Temple
    # ... optimized order
]

schedule_with_times = [
    {
        "poi_index": 0,
        "arrival_time_seconds": 32400,  # 9:00am
        "departure_time_seconds": 32400  # 9:00am (0 min stay)
    },
    {
        "poi_index": 1,
        "arrival_time_seconds": 33780,  # 9:23am (23min travel)
        "departure_time_seconds": 37380  # 10:23am (60min stay)
    },
    # ... rest of schedule
]
```

**4D. Result Formatting**

```python
# Convert to human-readable format
itinerary = [
    {
        "place_name": "Starting Point",
        "place_id": "start",
        "start_time": "09:00",
        "end_time": "09:00",
        "visit_duration_minutes": 0,
        "travel_time_to_next": 23
    },
    {
        "place_name": "Meiji Jingu",
        "place_id": "ChIJ...",
        "start_time": "09:23",
        "end_time": "10:23",
        "visit_duration_minutes": 60,
        "travel_time_to_next": 32
    },
    # ... rest of itinerary
]
```

**Output State Update:**
```python
{
    "itinerary": itinerary,  # 5-9 stops with optimized route
    "optimization_params": {
        "day_start_hour": 9,
        "day_end_hour": 22,
        "travel_mode": "walking"
    },
    "optimization_attempts": 2,  # Succeeded on 2nd try after extending hours
    "current_stage": "optimization_complete"
}
```

---

## Agent Deep Dive

### 1. Intake Agent (`app/agents/intake.py`)

**Purpose**: Parse natural language into structured constraints

**Input**:
```python
{
    "messages": [HumanMessage(content="...")],
}
```

**Core Function**: `extract_constraints(user_message: str)`

**LLM Interaction**:
```python
System Prompt:
"You are a trip planning assistant. Extract structured information from the user's message.
Return a JSON object with these fields:
- destination: str (city/country)
- budget: "budget" | "moderate" | "luxury"
- vibe: str (cultural, adventurous, relaxed, etc.)
- must_see: list of specific places or types
- avoid: list of things to avoid
- dietary_prefs: list of dietary requirements"

User Message: "I want to visit Tokyo..."

Response: {...structured constraints...}
```

**Output**:
- Validates and parses JSON from LLM
- Geocodes destination
- Returns `TripConstraints` TypedDict

**Error Handling**:
- Retry if JSON parsing fails
- Defaults for missing fields
- Validates destination exists

---

### 2. Discovery Agent (`app/agents/discovery.py`)

**Purpose**: Find and score relevant POIs

**Input**:
```python
{
    "constraints": TripConstraints,
    "destination_coords": {"lat": ..., "lng": ...}
}
```

**Process Flow**:

1. **Interest Extraction**:
   ```python
   interests = constraints['must_see'] + [constraints['vibe']]
   # ["temples", "modern architecture", "cultural"]
   ```

2. **Multi-Category Search**:
   ```python
   for interest in interests:
       # Map to Google Places types
       place_types = interest_to_place_type_mapping(interest)
       # "temples" -> ['place_of_worship', 'tourist_attraction']
       
       for place_type in place_types:
           results = google_maps.nearby_search(
               location=coords,
               radius=5000,
               type=place_type
           )
           all_pois.extend(results)
   ```

3. **Deduplication**:
   ```python
   unique_pois = {poi['place_id']: poi for poi in all_pois}.values()
   ```

4. **Enrichment** (top 30 POIs):
   ```python
   for poi in unique_pois[:30]:
       details = google_maps.place_details(poi['place_id'])
       poi.update(details)
   ```

5. **Scoring**:
   ```python
   for poi in enriched_pois:
       score_poi(poi, constraints)  # Adds ai_score field
   ```

6. **Sorting**:
   ```python
   pois.sort(key=lambda x: x['ai_score'], reverse=True)
   ```

**Output**:
```python
{
    "potential_pois": [... top 30 scored POIs ...],
    "current_stage": "discovery_complete"
}
```

---

### 3. Optimizer Agent (`app/agents/optimizer.py`)

**Purpose**: Create feasible, optimized daily itinerary

**Input**:
```python
{
    "potential_pois": List[POI],
    "destination_coords": dict,
    "optimization_params": {
        "day_start_hour": 9,
        "day_end_hour": 22,
        "travel_mode": "walking",
        "strict_mode": False
    }
}
```

**Process Flow**:

1. **POI Preparation**:
   - Limit to top 8 POIs (API constraints)
   - Add starting point as depot
   - Extract visit durations and time windows

2. **Travel Matrix Calculation**:
   - Call Google Distance Matrix API
   - Build NxN matrix of travel times

3. **Optimization Attempt**:
   - Run OR-Tools VRPTW solver
   - If success → format and return itinerary
   - If failure → proceed to adaptive handling

4. **Adaptive Constraint Handling** (if failure):
   ```python
   if not strict_mode and attempts < 3:
       suggestions = generate_suggestions()
       # [
       #   "Extend day: 9-22 → 7-23",
       #   "Reduce POIs: 8 → 5",
       #   "Change mode: walking → transit"
       # ]
       
       # Auto-apply best suggestion
       best_suggestion = suggestions[0]
       new_params = apply_suggestion(best_suggestion)
       
       # Retry optimization
       return {"optimization_params": new_params, "retry": True}
   ```

5. **Result Formatting**:
   ```python
   # Convert optimizer output to ItineraryItem list
   itinerary = [
       {
           "place_name": ...,
           "start_time": "HH:MM",
           "end_time": "HH:MM",
           "visit_duration_minutes": ...,
           "travel_time_to_next": ...
       },
       ...
   ]
   ```

**Output** (Success):
```python
{
    "itinerary": List[ItineraryItem],
    "optimization_attempts": 2,
    "current_stage": "optimization_complete"
}
```

**Output** (Needs User Input):
```python
{
    "optimization_suggestions": [
        {
            "suggestion_type": "extend_hours",
            "original_value": "9:00-18:00",
            "suggested_value": "7:00-20:00",
            "reason": "Extended day allows visiting all locations",
            "feasibility_score": 0.9
        }
    ],
    "current_stage": "needs_user_input_for_constraints"
}
```

---

## Optimizer Technical Details

### Input Specification

```python
ItineraryOptimizer.optimize_day_itinerary(
    pois=[
        {
            "name": str,
            "poi_id": str,
            "location": {"lat": float, "lng": float},
            "time_to_visit_minutes": int,
            "opening_time": Optional[int],  # Seconds from midnight
            "closing_time": Optional[int]   # Seconds from midnight
        },
        # ... 2-8 more POIs
    ],
    travel_time_matrix=[
        [0, t01, t02, ...],  # Travel times in seconds
        [t10, 0, t12, ...],
        [...],
    ],  # NxN matrix where N = len(pois)
    start_location_idx=0,
    day_start_time=32400,  # 9am in seconds
    day_end_time=79200     # 10pm in seconds
)
```

### OR-Tools Model

**Variables**:
- `route[i]`: Next POI to visit after POI i
- `time[i]`: Arrival time at POI i

**Objective**:
```
Minimize: Σ (travel_time[i][route[i]] + service_time[i])
```

**Constraints**:
1. **Time Window Constraints**:
   ```
   opening_time[i] ≤ time[i] ≤ closing_time[i] - service_time[i]
   ```

2. **Time Continuity**:
   ```
   time[route[i]] ≥ time[i] + service_time[i] + travel_time[i][route[i]]
   ```

3. **Day Boundary**:
   ```
   day_start ≤ time[0]
   time[end] ≤ day_end
   ```

4. **Each POI Visited Once**:
   ```
   All POIs appear exactly once in route
   ```

### Output Specification

```python
{
    "success": True,
    "route": [0, 3, 1, 4, 2],  # Optimized visit order (POI indices)
    "schedule": [
        {
            "name": "Starting Point",
            "poi_id": "start",
            "arrival_time": "09:00",
            "departure_time": "09:00",
            "arrival_time_seconds": 32400,
            "departure_time_seconds": 32400,
            "visit_duration_minutes": 0,
            "travel_to_next_minutes": 23,
            "index": 0
        },
        # ... rest of schedule
    ],
    "total_travel_time_minutes": 180,
    "total_visit_time_minutes": 240,
    "day_end_time": "18:30",
    "day_end_time_seconds": 66600
}
```

---

## State Management

### TravelAgentState Structure

```python
class TravelAgentState(TypedDict):
    # Conversation
    messages: List[BaseMessage]  # Full chat history
    
    # Trip Planning
    constraints: Optional[TripConstraints]
    destination_coords: Optional[Dict[str, float]]
    
    # Discovery
    potential_pois: List[POI]  # Up to 30 POIs, scored
    
    # Optimization
    itinerary: List[ItineraryItem]  # Final optimized schedule
    optimization_params: Optional[OptimizationParameters]
    optimization_suggestions: List[OptimizationSuggestion]
    optimization_attempts: int
    
    # Control Flow
    current_stage: str
    error_message: Optional[str]
    
    # Metadata
    trip_id: Optional[str]
    created_at: Optional[str]
    updated_at: Optional[str]
```

### State Evolution Example

**After Intake**:
```python
{
    "messages": [HumanMessage(...), AIMessage(...)],
    "constraints": {...},
    "destination_coords": {...},
    "current_stage": "intake_complete"
}
```

**After Discovery**:
```python
{
    # ... previous state ...
    "potential_pois": [30 POIs],
    "current_stage": "discovery_complete"
}
```

**After Optimization**:
```python
{
    # ... previous state ...
    "itinerary": [5 items],
    "optimization_params": {...},
    "optimization_attempts": 1,
    "current_stage": "optimization_complete"
}
```

---

## API Integrations

### 1. Google Maps Geocoding API

**Purpose**: Convert addresses to coordinates

**Request**:
```python
GET https://maps.googleapis.com/maps/api/geocode/json
?address=Tokyo,Japan
&key=YOUR_API_KEY
```

**Response**:
```json
{
  "results": [{
    "formatted_address": "Tokyo, Japan",
    "geometry": {
      "location": {"lat": 35.6762, "lng": 139.6503}
    }
  }]
}
```

**Cost**: $5 per 1000 requests

---

### 2. Google Places API - Nearby Search

**Purpose**: Discover POIs by type/keyword

**Request**:
```python
GET https://maps.googleapis.com/maps/api/place/nearbysearch/json
?location=35.6762,139.6503
&radius=5000
&type=tourist_attraction
&key=YOUR_API_KEY
```

**Response**:
```json
{
  "results": [
    {
      "place_id": "ChIJ...",
      "name": "Tokyo Tower",
      "geometry": {"location": {"lat": 35.6586, "lng": 139.7454}},
      "rating": 4.3,
      "user_ratings_total": 125000,
      "price_level": 2,
      "types": ["tourist_attraction", "point_of_interest"]
    }
  ]
}
```

**Cost**: $32 per 1000 requests (Basic Data) + $3 per 1000 (Contact Data)

---

### 3. Google Distance Matrix API

**Purpose**: Calculate travel times between multiple points

**Request**:
```python
POST https://maps.googleapis.com/maps/api/distancematrix/json
{
  "origins": ["35.6762,139.6503", "35.6764,139.6993", ...],
  "destinations": ["35.6762,139.6503", "35.6764,139.6993", ...],
  "mode": "walking",
  "key": "YOUR_API_KEY"
}
```

**Response**:
```json
{
  "rows": [
    {
      "elements": [
        {"distance": {"value": 2300}, "duration": {"value": 1380}},
        ...
      ]
    }
  ]
}
```

**Cost**: $5 per 1000 elements (100 elements = 10x10 origins/destinations)

**Limits**: Max 100 elements per request (e.g., 10x10 matrix)

---

### 4. Google Gemini API

**Purpose**: Natural language understanding and generation

**Request**:
```python
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
{
  "contents": [{
    "parts": [{
      "text": "Extract trip constraints from: I want to visit Tokyo..."
    }]
  }]
}
```

**Response**:
```json
{
  "candidates": [{
    "content": {
      "parts": [{
        "text": "{\"destination\": \"Tokyo, Japan\", ...}"
      }]
    }
  }]
}
```

**Cost**: $0.075 per 1M input tokens, $0.30 per 1M output tokens

---

## Real Example Walkthrough

### Tokyo Trip - Complete Data Flow

**User Input**: "Plan a day in Tokyo. I love temples and technology."

**1. Intake Agent**:
- Sends to Gemini: "Extract constraints from this message..."
- Gemini returns: `{"destination": "Tokyo", "interests": ["temples", "technology"]}`
- Geocodes "Tokyo" → `35.6762, 139.6503`
- **State**: constraints + coords set

**2. Discovery Agent**:
- Searches Google Places for "temples" near Tokyo → 15 results
- Searches Google Places for "technology" near Tokyo → 15 results
- Gets details for top 20 unique POIs
- Scores each:
  - Meiji Jingu: 4.5★, 45k reviews → 91.5 score
  - Tokyo Tower: 4.3★, 125k reviews → 89.2 score
- **State**: 30 scored POIs added

**3. Optimizer Agent**:
- Takes top 8 POIs + starting point = 9 locations
- Calls Distance Matrix API for 9x9 = 81 travel times
- Feeds to OR-Tools:
  - Minimize travel time
  - Respect 9am-10pm window
  - 60min per POI
- OR-Tools returns route: [0, 1, 4, 3, 2]
- Formats as itinerary with times
- **State**: itinerary with 5 stops, complete!

**Final Output**:
```
09:00-09:00: Starting Point
09:23-10:23: Meiji Jingu (60min visit, 23min travel)
10:55-11:55: Hachiko Statue (60min visit, 32min travel)
12:27-13:27: Tokyo Tower (60min visit, 32min travel)
13:59-14:59: Tokyo Skytree (60min visit)
```

---

## Performance Metrics

### API Calls Per Trip

| Service | Calls | Cost |
|---------|-------|------|
| Gemini (Intake) | 1 | ~$0.0001 |
| Geocoding | 1 | $0.005 |
| Places Nearby | 2-5 | $0.10-0.16 |
| Places Details | 20 | $0.64 |
| Distance Matrix | 1 (81 elements) | $0.004 |
| **Total** | **25-28** | **~$0.79** |

### Timing

| Stage | Duration |
|-------|----------|
| Intake Agent | 1-2s |
| Discovery Agent | 3-5s |
| Optimizer Agent | 2-4s |
| **Total** | **6-11s** |

---

## Success Metrics

From our 6-city test suite:
- ✅ **100% Success Rate** across all scenarios
- ✅ **Paris**: 5 stops, 5h51m total time
- ✅ **New York**: 5 stops, 4h44m total time  
- ✅ **London**: 5 stops, 6h20m total time
- ✅ **Barcelona**: 5 stops, 6h59m total time
- ✅ **Rome**: 5 stops, 6h3m total time
- ✅ **Kyoto**: 9 stops, 9h34m total time (driving mode)

---

**Document Version**: 1.0  
**Last Updated**: October 21, 2025  
**Status**: Phase 2.1 Complete ✅












