"""Transport Agent - LangGraph Node (Phase 2.3 - Week 4).

This agent is responsible for:
1. Finding optimal flights for intercity travel
2. Planning local transport routes
3. Multi-modal transport recommendations
4. AI-powered flight and route analysis
5. Time efficiency and cost optimization

The agent uses swappable providers for flights (Amadeus) and
routes (Google Maps) to provide comprehensive transport planning.
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import date, timedelta

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage

from app.models.state import TravelAgentState
from app.config import settings
from app.services.providers.transport.amadeus_flights import get_amadeus_flight_provider
from app.services.providers.transport.google_routes import get_google_routes_provider
from app.services.providers.base import Flight, Route

logger = logging.getLogger(__name__)


class TransportAgent:
    """Agent for finding and recommending transport options.
    
    Features:
    - Flight search and recommendations
    - Local transport route planning
    - Multi-modal transport analysis
    - Time efficiency scoring
    - CO2 emissions tracking
    - AI-powered recommendations
    """
    
    def __init__(self):
        """Initialize the transport agent."""
        self.flight_provider = get_amadeus_flight_provider()
        self.route_provider = get_google_routes_provider()
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash-exp",
            google_api_key=settings.gemini_api_key,
            temperature=0.7
        )
        logger.info("TransportAgent initialized")
    
    async def search_flights(
        self,
        origin: str,
        destination: str,
        departure_date: date,
        return_date: Optional[date] = None,
        num_passengers: int = 1,
        cabin_class: str = "economy",
        budget_preference: str = "moderate"
    ) -> List[Flight]:
        """Search for flights matching criteria.
        
        Args:
            origin: Origin airport/city code
            destination: Destination airport/city code
            departure_date: Departure date
            return_date: Return date (None for one-way)
            num_passengers: Number of passengers
            cabin_class: Cabin class preference
            budget_preference: Budget preference for filtering
        
        Returns:
            List of Flight objects
        """
        logger.info(f"Searching flights: {origin} → {destination}")
        
        # Map budget to filters
        max_results = 20 if budget_preference == 'budget' else 15
        
        flights = await self.flight_provider.search(
            origin=origin,
            destination=destination,
            departure_date=departure_date,
            return_date=return_date,
            num_passengers=num_passengers,
            cabin_class=cabin_class,
            filters={'max_results': max_results, 'currency': 'USD'}
        )
        
        logger.info(f"Found {len(flights)} flight options")
        return flights
    
    def calculate_flight_efficiency_score(self, flight: Flight) -> float:
        """Calculate time efficiency score for a flight (0-100).
        
        Considers:
        - Number of stops (direct > 1 stop > 2 stops)
        - Layover quality (short layovers penalized)
        - Total duration vs distance
        
        Args:
            flight: Flight object
        
        Returns:
            Efficiency score from 0-100
        """
        # Base score from stops
        if flight.stops == 0:
            base_score = 100
        elif flight.stops == 1:
            base_score = 70
        elif flight.stops == 2:
            base_score = 40
        else:
            base_score = 20
        
        # Duration penalty
        # Typical flight speeds: ~800 km/h
        # Penalize if flight is significantly longer than expected
        expected_duration_hours = 2 + (flight.stops * 1.5)  # Base time + layovers
        actual_duration_hours = flight.duration_minutes / 60
        
        if actual_duration_hours > expected_duration_hours:
            duration_penalty = min(30, (actual_duration_hours - expected_duration_hours) * 5)
            base_score -= duration_penalty
        
        return max(0, min(100, base_score))
    
    def calculate_price_value_score(
        self,
        flight: Flight,
        budget_preference: str,
        avg_price: float
    ) -> float:
        """Calculate price-value score for a flight (0-100).
        
        Args:
            flight: Flight object
            budget_preference: Budget preference
            avg_price: Average price of all flights
        
        Returns:
            Price-value score from 0-100
        """
        price = flight.price
        
        # Budget targets
        budget_targets = {
            'budget': avg_price * 0.7,
            'moderate': avg_price,
            'luxury': avg_price * 1.5
        }
        
        target = budget_targets.get(budget_preference.lower(), avg_price)
        
        # Calculate deviation from target
        if price <= target:
            # Below or at target: excellent value
            score = 100 - (target - price) / target * 20
        else:
            # Above target: penalize
            deviation_pct = (price - target) / target
            if deviation_pct < 0.2:
                score = 80 - deviation_pct * 100
            elif deviation_pct < 0.5:
                score = 60 - (deviation_pct - 0.2) * 100
            else:
                score = max(0, 40 - (deviation_pct - 0.5) * 80)
        
        return max(0, min(100, score))
    
    def calculate_comfort_score(self, flight: Flight) -> float:
        """Calculate comfort score (0-100).
        
        Considers:
        - Cabin class
        - Baggage allowance
        - Direct vs connections
        
        Args:
            flight: Flight object
        
        Returns:
            Comfort score from 0-100
        """
        # Base score from cabin class
        cabin_scores = {
            'economy': 50,
            'premium_economy': 70,
            'business': 90,
            'first': 100
        }
        base_score = cabin_scores.get(flight.cabin_class, 50)
        
        # Bonus for direct flights
        if flight.stops == 0:
            base_score += 20
        
        # Bonus for baggage
        if flight.baggage_allowance and '0 bag' not in flight.baggage_allowance:
            base_score += 10
        
        return min(100, base_score)
    
    def calculate_environmental_score(self, flight: Flight) -> float:
        """Calculate environmental score (0-100).
        
        Based on CO2 emissions.
        
        Args:
            flight: Flight object
        
        Returns:
            Environmental score from 0-100 (higher is better/greener)
        """
        if not flight.co2_emissions_kg:
            return 50.0  # Neutral if no data
        
        # Typical emissions: ~100-150 kg per hour of flight
        expected_emissions = (flight.duration_minutes / 60) * 125
        
        if flight.co2_emissions_kg <= expected_emissions:
            # Better than average
            score = 70 + (expected_emissions - flight.co2_emissions_kg) / expected_emissions * 30
        else:
            # Worse than average
            score = 70 - (flight.co2_emissions_kg - expected_emissions) / expected_emissions * 70
        
        return max(0, min(100, score))
    
    async def calculate_overall_flight_score(
        self,
        flight: Flight,
        budget_preference: str,
        avg_price: float
    ) -> float:
        """Calculate overall flight score (0-100).
        
        Weighted combination of:
        - Time efficiency (35%)
        - Price-value (35%)
        - Comfort (20%)
        - Environmental (10%)
        
        Args:
            flight: Flight object
            budget_preference: Budget preference
            avg_price: Average price of all flights
        
        Returns:
            Overall score from 0-100
        """
        efficiency_score = self.calculate_flight_efficiency_score(flight)
        price_score = self.calculate_price_value_score(flight, budget_preference, avg_price)
        comfort_score = self.calculate_comfort_score(flight)
        env_score = self.calculate_environmental_score(flight)
        
        overall = (
            efficiency_score * 0.35 +
            price_score * 0.35 +
            comfort_score * 0.20 +
            env_score * 0.10
        )
        
        flight.ai_score = round(overall, 1)
        return overall
    
    async def analyze_local_transport(
        self,
        hotel_location: Dict[str, float],
        pois: List[dict],
        budget_preference: str
    ) -> Dict[str, Any]:
        """Analyze local transport options.
        
        Determines best mode for getting around the city.
        
        Args:
            hotel_location: Hotel coordinates {"lat": float, "lng": float}
            pois: List of POIs to visit
            budget_preference: Budget preference
        
        Returns:
            Transport analysis dict
        """
        if not pois:
            return {
                "recommended_mode": "walking",
                "analysis": "No specific POIs to visit, walking recommended for exploration.",
                "estimated_daily_cost": 0
            }
        
        # Test different modes with first few POIs
        test_pois = pois[:5]
        mode_data = {}
        
        for mode in ["walking", "transit", "driving"]:
            total_time = 0
            count = 0
            
            for poi in test_pois:
                route = await self.route_provider.get_route(
                    origin=hotel_location,
                    destination={"lat": poi.get('lat', 0), "lng": poi.get('lng', 0)},
                    mode=mode
                )
                
                if route:
                    total_time += route.duration_seconds
                    count += 1
            
            if count > 0:
                avg_time = total_time / count / 60  # minutes
                mode_data[mode] = {
                    "avg_time_minutes": avg_time,
                    "tested_routes": count
                }
        
        # Determine best mode based on budget and times
        if budget_preference == 'budget':
            # Prefer walking if feasible
            if mode_data.get('walking', {}).get('avg_time_minutes', 999) < 30:
                recommended = "walking"
                daily_cost = 0
            else:
                recommended = "transit"
                daily_cost = 10  # Estimate day pass
        elif budget_preference == 'luxury':
            # Prefer driving/taxis
            recommended = "driving"
            daily_cost = 50  # Estimate taxi/uber cost
        else:
            # Moderate: mix of transit and walking
            walking_time = mode_data.get('walking', {}).get('avg_time_minutes', 999)
            if walking_time < 25:
                recommended = "walking"
                daily_cost = 0
            else:
                recommended = "transit"
                daily_cost = 10
        
        analysis = f"""
Based on the locations you're visiting:
- Walking: {mode_data.get('walking', {}).get('avg_time_minutes', 'N/A'):.0f} min average to attractions
- Public Transit: {mode_data.get('transit', {}).get('avg_time_minutes', 'N/A'):.0f} min average
- Driving/Taxi: {mode_data.get('driving', {}).get('avg_time_minutes', 'N/A'):.0f} min average

**Recommendation:** Use **{recommended}** as your primary mode of transport.
Estimated daily transport cost: ${daily_cost}
"""
        
        return {
            "recommended_mode": recommended,
            "mode_comparison": mode_data,
            "analysis": analysis.strip(),
            "estimated_daily_cost": daily_cost
        }
    
    async def generate_flight_recommendations(
        self,
        flights: List[Flight],
        is_roundtrip: bool,
        budget_preference: str
    ) -> str:
        """Generate AI-powered flight recommendations.
        
        Args:
            flights: List of scored flights
            is_roundtrip: Whether it's a round-trip search
            budget_preference: Budget preference
        
        Returns:
            Formatted recommendation text
        """
        # Get top flights
        top_flights = sorted(flights, key=lambda f: f.ai_score, reverse=True)[:3]
        
        # Group round-trip flights
        if is_roundtrip:
            offers = {}
            for flight in top_flights:
                if flight.offer_id not in offers:
                    offers[flight.offer_id] = []
                offers[flight.offer_id].append(flight)
            
            flight_details = []
            for i, (offer_id, flight_pair) in enumerate(list(offers.items())[:3], 1):
                total_price = sum(f.price for f in flight_pair)
                total_duration = sum(f.duration_minutes for f in flight_pair)
                
                return_airline = flight_pair[1].airline if len(flight_pair) > 1 else 'N/A'
                return_stops = flight_pair[1].stops if len(flight_pair) > 1 else 0
                return_duration = f"{flight_pair[1].duration_minutes//60}h {flight_pair[1].duration_minutes%60}m" if len(flight_pair) > 1 else '0h 0m'
                return_co2 = (flight_pair[1].co2_emissions_kg if len(flight_pair) > 1 and flight_pair[1].co2_emissions_kg else 0)
                
                details = f"""
Option {i}: ${total_price:.2f} total
- Outbound: {flight_pair[0].airline} ({flight_pair[0].stops} stop(s), {flight_pair[0].duration_minutes//60}h {flight_pair[0].duration_minutes%60}m)
- Return: {return_airline} ({return_stops} stop(s), {return_duration})
- AI Score: {flight_pair[0].ai_score:.1f}/100
- CO2: {(flight_pair[0].co2_emissions_kg or 0) + return_co2:.0f} kg
"""
                flight_details.append(details)
        else:
            flight_details = []
            for i, flight in enumerate(top_flights, 1):
                stops_text = "Direct" if flight.stops == 0 else f"{flight.stops} stop(s)"
                details = f"""
Option {i}: {flight.airline} - ${flight.price:.2f}
- Route: {flight.origin} → {flight.destination} ({stops_text})
- Duration: {flight.duration_minutes//60}h {flight.duration_minutes%60}m
- Cabin: {flight.cabin_class or 'Economy'}
- AI Score: {flight.ai_score:.1f}/100
- CO2: {flight.co2_emissions_kg:.0f} kg
"""
                flight_details.append(details)
        
        system_prompt = f"""You are a travel expert helping users choose the best flight.
The user has a {budget_preference} budget.

Provide brief recommendations for each flight option (2-3 sentences each).
Consider price, duration, convenience, and environmental impact."""
        
        user_prompt = f"""Here are the top flight options:

{''.join(flight_details)}

Please recommend which flight is best and why."""
        
        try:
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ]
            
            response = await self.llm.ainvoke(messages)
            return response.content
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return "See flight options above. Choose based on your priorities for price, time, and comfort."


async def transport_agent_node(state: TravelAgentState) -> Dict[str, Any]:
    """LangGraph node for transport recommendations.
    
    This node:
    1. Searches for flights (if origin specified)
    2. Analyzes local transport options
    3. Scores flights and routes
    4. Generates AI recommendations
    5. Updates state with transport recommendations
    
    Args:
        state: Current travel agent state
    
    Returns:
        State updates dict
    """
    logger.info("=" * 60)
    logger.info("TRANSPORT AGENT NODE")
    logger.info("=" * 60)
    
    agent = TransportAgent()
    
    try:
        # Extract info from state
        constraints = state.get('constraints') or {}
        destination = constraints.get('destination')
        budget = constraints.get('budget', 'moderate')
        num_days = constraints.get('num_days', 3)
        num_travelers = constraints.get('num_travelers', 1)
        origin_city = constraints.get('origin')  # Optional
        pois = state.get('potential_pois') or []
        recommended_hotels = state.get('recommended_hotels') or []
        
        results = {}
        messages = []
        
        # Part 1: Flight search (if origin specified)
        if origin_city:
            logger.info(f"Searching flights: {origin_city} → {destination}")
            
            departure_date = date.today() + timedelta(days=14)
            return_date = departure_date + timedelta(days=num_days)
            
            flights = await agent.search_flights(
                origin=origin_city,
                destination=destination,
                departure_date=departure_date,
                return_date=return_date,
                num_passengers=num_travelers,
                cabin_class="economy",
                budget_preference=budget
            )
            
            if flights:
                # Score flights
                avg_price = sum(f.price for f in flights) / len(flights)
                
                for flight in flights:
                    await agent.calculate_overall_flight_score(
                        flight=flight,
                        budget_preference=budget,
                        avg_price=avg_price
                    )
                
                # Sort by score
                flights.sort(key=lambda f: f.ai_score, reverse=True)
                
                # Generate recommendations
                is_roundtrip = len(set(f.offer_id for f in flights)) < len(flights)
                recommendations = await agent.generate_flight_recommendations(
                    flights=flights,
                    is_roundtrip=is_roundtrip,
                    budget_preference=budget
                )
                
                # Format results
                top_flights = flights[:3]
                flight_summary = f"\n✈️ **Flight Recommendations: {origin_city} → {destination}**\n\n"
                
                for i, flight in enumerate(top_flights, 1):
                    stops_text = "Direct" if flight.stops == 0 else f"{flight.stops} stop(s)"
                    flight_summary += f"**{i}. {flight.airline}** - ${flight.price:.2f}\n"
                    flight_summary += f"   ⏱️ Duration: {flight.duration_minutes//60}h {flight.duration_minutes%60}m ({stops_text})\n"
                    flight_summary += f"   📊 AI Score: {flight.ai_score:.1f}/100\n"
                    if flight.co2_emissions_kg:
                        flight_summary += f"   🌱 CO2: {flight.co2_emissions_kg:.0f} kg\n"
                    flight_summary += "\n"
                
                flight_summary += f"**AI Analysis:**\n{recommendations}\n"
                
                messages.append(flight_summary)
                results['recommended_flights'] = [f.__dict__ for f in top_flights]
        
        # Part 2: Local transport analysis
        logger.info("Analyzing local transport options...")
        
        hotel_location = None
        if recommended_hotels:
            # Use first recommended hotel
            hotel = recommended_hotels[0]
            hotel_location = {"lat": hotel.get('latitude'), "lng": hotel.get('longitude')}
        
        if hotel_location and pois:
            transport_analysis = await agent.analyze_local_transport(
                hotel_location=hotel_location,
                pois=pois,
                budget_preference=budget
            )
            
            transport_summary = f"\n🚇 **Local Transport Recommendations**\n\n"
            transport_summary += transport_analysis['analysis']
            transport_summary += f"\n\n💰 Estimated daily transport budget: ${transport_analysis['estimated_daily_cost']}\n"
            
            messages.append(transport_summary)
            results['local_transport'] = transport_analysis
        
        logger.info("✅ Transport agent complete")
        
        return {
            "messages": messages,
            **results,
            "current_stage": "transport_complete"
        }
        
    except Exception as e:
        logger.error(f"Error in transport agent: {e}")
        import traceback
        traceback.print_exc()
        return {
            "messages": [f"❌ Error planning transport: {str(e)}"],
            "errors": [f"transport_agent: {str(e)}"]
        }

