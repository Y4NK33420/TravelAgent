# Amadeus Hotel Search API - Technical Implementation Research

## OBJECTIVE
Gather complete technical specifications for implementing Amadeus Hotel Search API in Python, including exact endpoint URLs, request/response schemas, authentication flow, error handling, and code examples.

---

## PART 1: Authentication & Authorization

### 1.1 OAuth 2.0 Token Flow

**Research Questions:**

1. **Token Endpoint:**
   - Exact URL for test environment: `https://test.api.amadeus.com/v1/security/oauth2/token`
   - Exact URL for production environment: `https://api.amadeus.com/v1/security/oauth2/token`
   - Confirm these are correct

2. **Request Format:**
   ```http
   POST /v1/security/oauth2/token
   Content-Type: application/x-www-form-urlencoded
   
   grant_type=client_credentials&
   client_id=YOUR_API_KEY&
   client_secret=YOUR_API_SECRET
   ```
   - Is this format correct?
   - Are there any required headers beyond Content-Type?

3. **Response Schema:**
   ```json
   {
     "type": "amadeusOAuth2Token",
     "username": "...",
     "application_name": "...",
     "client_id": "...",
     "token_type": "Bearer",
     "access_token": "...",
     "expires_in": 1799,
     "state": "approved"
   }
   ```
   - Confirm this schema
   - What is the exact expiry time? (1799 seconds = ~30 minutes?)
   - How should we handle token refresh? (get new token before expiry or on 401?)

4. **Error Responses:**
   - What error codes are returned for invalid credentials?
   - Example error response schemas?

5. **Best Practices:**
   - Should we cache the token and reuse it?
   - Thread-safe token management pattern?
   - Rate limits on token endpoint itself?

---

## PART 2: Hotel Search Workflow

### 2.1 Step 1: Hotel List by City (Finding Hotel IDs)

**Endpoint:** `GET /v1/reference-data/locations/hotels/by-city`

**Research Questions:**

1. **Request Parameters:**
   ```python
   params = {
       "cityCode": "PAR",  # IATA city code
       "radius": 5,        # In km?
       "radiusUnit": "KM",
       "hotelSource": "ALL"  # What are valid values?
   }
   ```
   - Are these all the available parameters?
   - What is `hotelSource`? Options: "ALL", "GDS", "BEDBANK"?
   - Can we search by lat/lng instead of cityCode?
   - Max radius allowed?

2. **Response Schema:**
   ```json
   {
     "data": [
       {
         "chainCode": "RT",
         "iataCode": "PAR",
         "dupeId": 123456,
         "name": "Hotel Example",
         "hotelId": "RTPAR123",
         "geoCode": {
           "latitude": 48.8566,
           "longitude": 2.3522
         },
         "address": {
           "countryCode": "FR"
         }
       }
     ],
     "meta": {
       "count": 100,
       "links": {
         "self": "...",
         "next": "..."
       }
     }
   }
   ```
   - Confirm this schema
   - What fields are guaranteed vs optional?
   - How does pagination work? (next link?)
   - Max results per page?
   - What is `dupeId`? (for deduplication?)

3. **Error Handling:**
   - What happens if cityCode is invalid?
   - Error response schema?
   - Status codes: 400, 404, 429, 500?

4. **Rate Limits:**
   - Requests per second allowed?
   - Rate limit headers in response?
   - How to detect rate limiting (status code 429)?

---

### 2.2 Step 2: Hotel Offers Search (Getting Prices & Availability)

**Endpoint:** `GET /v3/shopping/hotel-offers`

**Research Questions:**

1. **Request Parameters:**
   ```python
   params = {
       "hotelIds": "RTPAR123,RTPAR456",  # Comma-separated, max how many?
       "adults": 2,
       "checkInDate": "2025-11-01",  # Format: YYYY-MM-DD?
       "checkOutDate": "2025-11-05",
       "roomQuantity": 1,
       "priceRange": "100-500",  # Format?
       "currency": "USD",
       "paymentPolicy": "NONE",  # What are valid values?
       "boardType": "ROOM_ONLY",  # What are options?
       "includeClosed": False,
       "bestRateOnly": True,
       "view": "FULL",  # What does this control?
       "sort": "PRICE"  # Options: PRICE, DISTANCE, RATING?
   }
   ```
   - Confirm all parameter names and formats
   - What is max number of hotelIds per request?
   - What are valid values for `paymentPolicy`, `boardType`, `view`, `sort`?
   - Can we filter by amenities (WiFi, pool, parking)?
   - Can we filter by rating (4+ stars)?

2. **Response Schema:**
   ```json
   {
     "data": [
       {
         "type": "hotel-offers",
         "hotel": {
           "type": "hotel",
           "hotelId": "RTPAR123",
           "chainCode": "RT",
           "dupeId": 123456,
           "name": "Hotel Example",
           "rating": "4",
           "cityCode": "PAR",
           "latitude": 48.8566,
           "longitude": 2.3522,
           "hotelDistance": {
             "distance": 1.5,
             "distanceUnit": "KM"
           },
           "address": {
             "lines": ["123 Rue de Rivoli"],
             "postalCode": "75001",
             "cityName": "Paris",
             "countryCode": "FR"
           },
           "contact": {
             "phone": "+33...",
             "fax": "+33...",
             "email": "..."
           },
           "description": {
             "lang": "en",
             "text": "..."
           },
           "amenities": ["WIFI", "POOL", "PARKING"],
           "media": [
             {
               "uri": "https://...",
               "category": "EXTERIOR"
             }
           ]
         },
         "available": true,
         "offers": [
           {
             "id": "...",
             "checkInDate": "2025-11-01",
             "checkOutDate": "2025-11-05",
             "rateCode": "...",
             "rateFamilyEstimated": {
               "code": "BAR",
               "type": "P"
             },
             "room": {
               "type": "ROH",
               "typeEstimated": {
                 "category": "STANDARD_ROOM",
                 "beds": 1,
                 "bedType": "DOUBLE"
               },
               "description": {
                 "text": "Standard Double Room",
                 "lang": "en"
               }
             },
             "guests": {
               "adults": 2
             },
             "price": {
               "currency": "USD",
               "base": "300.00",
               "total": "345.00",
               "taxes": [
                 {
                   "code": "...",
                   "amount": "45.00",
                   "currency": "USD",
                   "included": false
                 }
               ],
               "variations": {
                 "average": {
                   "base": "75.00"
                 },
                 "changes": [
                   {
                     "startDate": "2025-11-01",
                     "endDate": "2025-11-02",
                     "total": "80.00"
                   }
                 ]
               }
             },
             "policies": {
               "paymentType": "GUARANTEE",
               "cancellation": {
                 "type": "FULL_STAY",
                 "amount": "345.00",
                 "deadline": "2025-10-28T23:59:00"
               }
             },
             "self": "..."
           }
         ],
         "self": "..."
       }
     ],
     "meta": {
       "count": 50
     }
   }
   ```
   - **Confirm this nested schema is accurate**
   - What fields are always present vs optional?
   - What does `view=FULL` vs `view=LIGHT` return?
   - How are amenities encoded? (array of strings? codes?)
   - What are possible room type codes?
   - How to get reviews? (separate endpoint?)

3. **Pagination:**
   - Does this endpoint support pagination?
   - If yes, how? (offset/limit or cursor?)
   - Max results per page?

4. **Price Structure:**
   - Is `price.base` the nightly rate or total for stay?
   - What is `price.variations.average.base`? (average per night?)
   - Are taxes always itemized?
   - When is `price.total` different from `price.base + taxes`?

5. **Cancellation Policies:**
   - What are valid `policies.cancellation.type` values?
   - How to interpret deadline (timezone handling)?
   - Is refund amount always specified?

6. **Error Handling:**
   - What if no hotels have availability?
   - What if hotelIds are invalid?
   - Status codes for various errors?

---

### 2.3 Step 3: Hotel Offers (Single Hotel Detail)

**Endpoint:** `GET /v3/shopping/hotel-offers/{offerId}`

**Research Questions:**

1. **When to use this vs. bulk search?**
   - Is this for getting updated pricing before booking?
   - Response schema identical to offers array item above?

2. **Use Cases:**
   - Real-time price check
   - Availability confirmation
   - Getting full details (if initial search was `view=LIGHT`)

---

## PART 3: Alternative Search Methods

### 3.1 Hotel List by Geocode

**Endpoint:** `GET /v1/reference-data/locations/hotels/by-geocode`

**Research Questions:**

1. **Parameters:**
   ```python
   params = {
       "latitude": 48.8566,
       "longitude": 2.3522,
       "radius": 5,
       "radiusUnit": "KM",
       "hotelSource": "ALL"
   }
   ```
   - Is this useful for "hotels near me" or "hotels near POI"?
   - Response schema same as by-city?

2. **When to use this vs. by-city?**
   - User searches "hotels near Eiffel Tower" → use geocode?
   - User searches "hotels in Paris" → use cityCode?

---

### 3.2 Hotel List by Hotels (Bulk Lookup)

**Endpoint:** `GET /v1/reference-data/locations/hotels/by-hotels`

**Research Questions:**

1. **Parameters:**
   ```python
   params = {
       "hotelIds": "RTPAR123,RTPAR456,..."  # Max how many?
   }
   ```

2. **Use Case:**
   - Getting updated hotel metadata?
   - Validating hotelIds before search?

---

## PART 4: Hotel Ratings (Review Data)

**Endpoint:** `GET /v2/e-reputation/hotel-sentiments`

**Research Questions:**

1. **Parameters:**
   ```python
   params = {
       "hotelIds": "RTPAR123,RTPAR456"  # Max how many?
   }
   ```

2. **Response Schema:**
   ```json
   {
     "data": [
       {
         "type": "hotel-sentiment",
         "hotelId": "RTPAR123",
         "overallRating": 85,
         "numberOfRatings": 1234,
         "numberOfReviews": 456,
         "sentiments": {
           "sleepQuality": 82,
           "service": 88,
           "facilities": 80,
           "roomComforts": 78,
           "valueForMoney": 75,
           "catering": 85,
           "location": 92,
           "internet": 70,
           "pointsOfInterest": 90,
           "staff": 88
         }
       }
     ]
   }
   ```
   - Confirm this schema
   - What is the rating scale? (0-100?)
   - How often is this data updated?
   - Is this available for all hotels?

3. **Integration:**
   - Should we call this separately or can it be included in main search?
   - Cost: separate API call or included in hotel search quota?

---

## PART 5: Error Handling & Status Codes

**Research Questions:**

1. **Standard Error Response Schema:**
   ```json
   {
     "errors": [
       {
         "status": 400,
         "code": 477,
         "title": "INVALID FORMAT",
         "detail": "Invalid format for parameter checkInDate",
         "source": {
           "parameter": "checkInDate"
         }
       }
     ]
   }
   ```
   - Is this the standard format for all errors?
   - What are common error codes?

2. **HTTP Status Codes:**
   - `200`: Success
   - `400`: Bad request (invalid parameters)
   - `401`: Unauthorized (invalid/expired token)
   - `404`: Not found (invalid hotelId?)
   - `429`: Rate limit exceeded
   - `500`: Server error
   - `503`: Service unavailable
   - Are these correct?

3. **Rate Limiting:**
   - Response headers for rate limits:
     - `X-RateLimit-Limit: 40` (per second?)
     - `X-RateLimit-Remaining: 35`
     - `X-RateLimit-Reset: 1699564800`
   - Confirm header names
   - Confirm rate limit is 40 transactions per second (production)

4. **Retry Strategy:**
   - Should we retry on 500/503?
   - Exponential backoff recommendations?
   - Should we retry on 429 after `X-RateLimit-Reset`?

---

## PART 6: Python SDK vs. Direct HTTP

**Research Questions:**

1. **Official Python SDK:**
   - PyPI package name: `amadeus` ?
   - GitHub: https://github.com/amadeus4dev/amadeus-python ?
   - Latest version?
   - Does it handle token refresh automatically?

2. **SDK Example:**
   ```python
   from amadeus import Client, ResponseError
   
   amadeus = Client(
       client_id='YOUR_API_KEY',
       client_secret='YOUR_API_SECRET',
       hostname='test'  # or 'production'
   )
   
   # Hotel search
   response = amadeus.shopping.hotel_offers_search.get(
       hotelIds='RTPAR123',
       adults=2,
       checkInDate='2025-11-01',
       checkOutDate='2025-11-05'
   )
   
   hotels = response.data
   ```
   - Is this SDK usage correct?
   - Does SDK handle rate limiting?
   - Does SDK handle pagination automatically?

3. **Async Support:**
   - Does the SDK support asyncio/aiohttp?
   - If not, how to wrap in async (run_in_executor)?

4. **Direct HTTP vs. SDK:**
   - Pros/cons of each approach?
   - Which is better for production?

---

## PART 7: Test Environment vs. Production

**Research Questions:**

1. **Test Environment:**
   - Base URL: `https://test.api.amadeus.com`
   - Uses static/cached data (not real-time pricing)?
   - Free tier limits: 3,000 Hotel Search calls/month
   - Can we test booking flow without real transactions?

2. **Production Environment:**
   - Base URL: `https://api.amadeus.com`
   - Real-time pricing and availability
   - Pay-as-you-go after free tier
   - Rate limit: 40 transactions/second

3. **Data Differences:**
   - Are hotel IDs the same in test vs. production?
   - Is test data representative of production?
   - Can we switch between test/prod with just URL change?

---

## PART 8: Booking Flow (Future)

**For context (not immediate implementation):**

**Endpoint:** `POST /v1/booking/hotel-bookings`

**Research Questions:**

1. **Required Fields:**
   - offerId (from search)
   - Guest details (name, contact)
   - Payment details (how handled?)

2. **Payment Integration:**
   - Does Amadeus handle payment processing?
   - Or do we need external payment gateway?
   - PCI compliance requirements?

3. **Booking Confirmation:**
   - What data is returned?
   - Booking reference number?
   - Confirmation email sent by Amadeus or us?

---

## PART 9: Practical Implementation Questions

**Research Questions:**

1. **Caching Strategy:**
   - Which endpoints should we cache?
   - Recommended TTLs:
     - Hotel List (by-city): 7 days?
     - Hotel Offers (search): 5 minutes?
     - Hotel Sentiments (reviews): 1 day?

2. **Handling Large Cities:**
   - If NYC returns 5,000 hotels, how to:
     - Get offers for all of them? (batch by 100s?)
     - Filter/prioritize which to query?
     - Pagination strategy?

3. **Search Optimization:**
   - Should we filter hotels by distance before getting offers?
   - Should we sort by rating before querying prices?
   - Recommended workflow for "best 10 hotels in Paris"?

4. **Data Transformation:**
   - Example code for mapping Amadeus response → our `Hotel` model
   - Handling missing fields gracefully
   - Currency conversion (if needed)

5. **Cost Optimization:**
   - How to stay within free tier during development?
   - Strategies to minimize API calls:
     - Cache aggressively
     - Use `view=LIGHT` initially
     - Only get full details for top N results

---

## DELIVERABLES EXPECTED FROM RESEARCH

### 1. Complete Request/Response Examples

For each endpoint, provide:
- Full curl command with all headers
- Example request with all realistic parameters
- Example response with all fields populated
- Example error response

### 2. Field Mapping Table

| Amadeus Field | Our Model Field | Data Type | Always Present? | Notes |
|---------------|----------------|-----------|-----------------|-------|
| `data[].hotel.name` | `name` | string | Yes | Hotel name |
| `data[].offers[0].price.total` | `price_per_night` | float | Yes | Need to divide by nights? |
| ... | ... | ... | ... | ... |

### 3. Error Code Reference

| Error Code | HTTP Status | Description | Retry? | User Message |
|------------|------------|-------------|---------|--------------|
| 477 | 400 | Invalid date format | No | "Please check your dates" |
| ... | ... | ... | ... | ... |

### 4. Rate Limit Handling Code

Example Python code for:
- Detecting rate limits
- Exponential backoff
- Token refresh on 401

### 5. End-to-End Example

Complete Python script showing:
1. Authentication
2. Search hotels by city
3. Get offers for top 10
4. Parse response into our data model
5. Handle errors gracefully

### 6. SDK vs. HTTP Decision

Recommendation with pros/cons table

### 7. Testing Strategy

- How to test with test environment
- How to mock responses for unit tests
- Sample test data (hotelIds, cityCode that work in test env)

---

## RESEARCH METHODOLOGY

### Primary Sources:
1. **Official Docs:** https://developers.amadeus.com/self-service/category/hotels/api-doc/hotel-search
2. **API Reference:** https://developers.amadeus.com/self-service/category/hotels/api-doc/hotel-search/api-reference
3. **Python SDK:** https://github.com/amadeus4dev/amadeus-python
4. **Developer Guides:** https://developers.amadeus.com/blog

### Testing:
- Use Postman/Insomnia to test actual API calls
- Test with real API key in test environment
- Document exact responses received

### Community:
- Check GitHub issues for common problems
- Stack Overflow for integration examples
- Developer forum discussions

---

## SUCCESS CRITERIA

Research is complete when we have:

✅ **Exact endpoint URLs** (test + production)  
✅ **Complete request/response schemas** (with all fields documented)  
✅ **Authentication flow code** (working token management)  
✅ **Error handling patterns** (all status codes + retry logic)  
✅ **Rate limiting strategy** (detection + backoff)  
✅ **Field mapping table** (Amadeus → our model)  
✅ **SDK vs. HTTP decision** (with recommendation)  
✅ **Caching TTLs** (per endpoint)  
✅ **End-to-end example** (working Python code)  
✅ **Cost optimization tips** (stay within free tier)  

---

## ESTIMATED RESEARCH TIME: 3-4 hours

- **Endpoint testing:** 1-2 hours
- **Schema documentation:** 1 hour  
- **Code examples:** 1 hour
- **Writing deliverables:** 30 minutes

---

**START RESEARCH NOW** → Focus on Hotel Search API first (most critical for Week 1)



