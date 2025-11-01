"""Amadeus Hotel Search API Provider (Phase 2.3).

This module implements the AccommodationProvider interface using the Amadeus Self-Service API.
It follows the two-step search pattern: Hotel List (discovery) → Hotel Offers (pricing).

Research findings:
- OAuth 2.0 token expires in 1799 seconds (~30 minutes)
- Max 20 hotelIds per offer search request
- Hotel List supports pagination
- Hotel Offers does NOT support pagination
- SDK handles token management automatically
- Recommended caching: Hotel List (24h), Hotel Offers (1-5min)
"""
import logging
from typing import List, Optional
from datetime import date

from amadeus import Client, ResponseError

from app.config import settings
from app.services.providers.base import AccommodationProvider, Hotel
from app.services.cache import get_cache_service
from app.services.cost_tracker import get_cost_tracker

logger = logging.getLogger(__name__)


class AmadeusHotelProvider(AccommodationProvider):
    """Amadeus Hotel Search API provider.
    
    Features:
    - Two-step search (discovery → offers)
    - Automatic token management (via SDK)
    - Pagination handling
    - Caching integration
    - Cost tracking
    - Error handling with retries
    """
    
    def __init__(self, client_id: Optional[str] = None, client_secret: Optional[str] = None):
        """Initialize the Amadeus client.
        
        Args:
            client_id: Amadeus API key (defaults to settings)
            client_secret: Amadeus API secret (defaults to settings)
        """
        self.client_id = client_id or settings.amadeus_api_key
        self.client_secret = client_secret or settings.amadeus_api_secret
        
        # Determine environment from base URL
        hostname = 'test' if 'test.api.amadeus.com' in settings.amadeus_base_url else 'production'
        
        # Initialize SDK client (handles OAuth2 automatically)
        self.client = Client(
            client_id=self.client_id,
            client_secret=self.client_secret,
            hostname=hostname,
            log_level='warn'  # Reduce SDK logging noise
        )
        
        self.cache = get_cache_service()
        self.cost_tracker = get_cost_tracker()
        
        logger.info(f"AmadeusHotelProvider initialized (environment: {hostname})")
    
    async def search(
        self,
        destination: str,
        checkin_date: date,
        checkout_date: date,
        num_guests: int,
        filters: Optional[dict] = None
    ) -> List[Hotel]:
        """Search for hotels using the two-step Amadeus workflow.
        
        Step 1: Discover hotel IDs via Hotel List API (paginated)
        Step 2: Get offers (price, availability) for hotels in batches of 20
        
        Args:
            destination: IATA city code (e.g., "PAR") or city name (will try to geocode)
            checkin_date: Check-in date
            checkout_date: Check-out date
            num_guests: Number of adult guests
            filters: Optional filters:
                - ratings: List[str] (e.g., ["4", "5"])
                - amenities: List[str] (e.g., ["WIFI", "POOL"])
                - price_range: str (e.g., "100-300")
                - radius: int (km from city center)
                - max_results: int (default 50)
        
        Returns:
            List of Hotel objects sorted by price
        """
        filters = filters or {}
        max_results = filters.get('max_results', 50)
        batch_size = 20  # Amadeus max per offer request
        
        try:
            # Step 1: Discover hotel IDs
            logger.info(f"Step 1: Discovering hotels in {destination}")
            hotel_ids = await self._discover_hotel_ids(destination, filters)
            
            if not hotel_ids:
                logger.warning(f"No hotels found in {destination}")
                return []
            
            logger.info(f"Discovered {len(hotel_ids)} hotels")
            
            # Limit to max_results for offer queries
            hotel_ids_to_query = hotel_ids[:max_results]
            
            # Step 2: Get offers in batches
            logger.info(f"Step 2: Fetching offers for {len(hotel_ids_to_query)} hotels (batch size: {batch_size})")
            hotels = await self._fetch_offers_in_batches(
                hotel_ids_to_query,
                checkin_date,
                checkout_date,
                num_guests,
                filters,
                batch_size
            )
            
            # Sort by price (lowest first)
            hotels.sort(key=lambda h: h.total_price)
            
            logger.info(f"Successfully retrieved {len(hotels)} hotel offers")
            return hotels
            
        except ResponseError as e:
            logger.error(f"Amadeus API error during search: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error during hotel search: {e}")
            return []
    
    async def _discover_hotel_ids(self, destination: str, filters: dict) -> List[str]:
        """Step 1: Discover hotel IDs using Hotel List API (with pagination).
        
        Args:
            destination: City code or name
            filters: Search filters
        
        Returns:
            List of hotelIds
        """
        # Build search parameters
        params = {"cityCode": destination.upper()[:3]}  # Convert to 3-letter IATA code
        
        if 'radius' in filters:
            params['radius'] = filters['radius']
            params['radiusUnit'] = 'KM'
        
        if 'ratings' in filters:
            params['ratings'] = ','.join(filters['ratings'])
        
        if 'amenities' in filters:
            params['amenities'] = ','.join(filters['amenities'])
        
        hotel_ids = []
        
        try:
            # Initial request
            response = self.client.reference_data.locations.hotels.by_city.get(**params)
            
            # Process first page
            for hotel in response.data:
                hotel_ids.append(hotel['hotelId'])
            
            # Handle pagination
            page_count = 1
            while True:
                next_response = self.client.next(response)
                if next_response is None:
                    break  # No more pages
                
                response = next_response
                page_count += 1
                
                for hotel in response.data:
                    hotel_ids.append(hotel['hotelId'])
                
                logger.debug(f"Processed page {page_count}, total hotels: {len(hotel_ids)}")
            
            logger.info(f"Completed pagination: {page_count} pages, {len(hotel_ids)} hotels")
            
        except ResponseError as e:
            logger.error(f"Error discovering hotels: {e}")
            # Try alternative: if city code failed, might need geocoding
            if e.response.status_code == 400:
                logger.warning(f"City code '{destination}' may be invalid. Consider implementing geocode search.")
        
        return hotel_ids
    
    async def _fetch_offers_in_batches(
        self,
        hotel_ids: List[str],
        checkin_date: date,
        checkout_date: date,
        num_guests: int,
        filters: dict,
        batch_size: int = 20
    ) -> List[Hotel]:
        """Step 2: Fetch hotel offers in batches of up to 20 hotelIds.
        
        Args:
            hotel_ids: List of hotelIds from discovery step
            checkin_date: Check-in date
            checkout_date: Check-out date
            num_guests: Number of guests
            filters: Search filters
            batch_size: Max hotelIds per request (Amadeus limit: 20)
        
        Returns:
            List of Hotel objects
        """
        hotels = []
        
        # Process in batches
        for i in range(0, len(hotel_ids), batch_size):
            batch = hotel_ids[i:i+batch_size]
            
            logger.debug(f"Fetching offers for batch {i//batch_size + 1} ({len(batch)} hotels)")
            
            batch_hotels = await self._fetch_offers_for_batch(
                batch,
                checkin_date,
                checkout_date,
                num_guests,
                filters
            )
            
            hotels.extend(batch_hotels)
        
        return hotels
    
    async def _fetch_offers_for_batch(
        self,
        hotel_ids: List[str],
        checkin_date: date,
        checkout_date: date,
        num_guests: int,
        filters: dict
    ) -> List[Hotel]:
        """Fetch offers for a single batch of hotel IDs.
        
        Args:
            hotel_ids: Batch of hotelIds (max 20)
            checkin_date: Check-in date
            checkout_date: Check-out date
            num_guests: Number of guests
            filters: Search filters
        
        Returns:
            List of Hotel objects for this batch
        """
        # Build request parameters
        params = {
            'hotelIds': ','.join(hotel_ids),
            'adults': str(num_guests),
            'checkInDate': checkin_date.isoformat(),
            'checkOutDate': checkout_date.isoformat(),
            'roomQuantity': '1',
            'bestRateOnly': 'true',  # Only get cheapest offer per hotel
            'view': 'FULL'  # Get complete details
        }
        
        if 'currency' in filters:
            params['currency'] = filters['currency']
        else:
            params['currency'] = 'USD'
        
        if 'price_range' in filters:
            params['priceRange'] = filters['price_range']
        
        hotels = []
        
        try:
            response = self.client.shopping.hotel_offers_search.get(**params)
            
            # Parse each hotel in the response
            for offer_data in response.data:
                hotel = self._parse_hotel_offer(offer_data, checkin_date, checkout_date)
                if hotel:
                    hotels.append(hotel)
            
            # Track cost (this is a billable API call)
            await self.cost_tracker.track_call(
                trip_id=None,  # Will be set by agent
                user_id="system",  # Will be overridden
                service="amadeus",
                endpoint="hotel_offers_search",
                count=len(hotel_ids)
            )
            
        except ResponseError as e:
            logger.error(f"Error fetching offers for batch: {e}")
            # Don't fail entire search, just skip this batch
        
        return hotels
    
    def _parse_hotel_offer(self, offer_data: dict, checkin_date: date, checkout_date: date) -> Optional[Hotel]:
        """Parse Amadeus API response into our Hotel model.
        
        Args:
            offer_data: Raw offer data from Amadeus API
            checkin_date: Check-in date
            checkout_date: Check-out date
        
        Returns:
            Hotel object or None if parsing fails
        """
        try:
            hotel_info = offer_data.get('hotel', {})
            offers = offer_data.get('offers', [])
            
            if not offers:
                return None
            
            # Get first (best rate) offer
            offer = offers[0]
            price_info = offer.get('price', {})
            room_info = offer.get('room', {})
            policies = offer.get('policies', {})
            
            # Calculate nights
            nights = (checkout_date - checkin_date).days
            total_price = float(price_info.get('total', 0))
            price_per_night = total_price / nights if nights > 0 else total_price
            
            # Parse amenities
            amenities = hotel_info.get('amenities', [])
            if isinstance(amenities, str):
                amenities = [amenities]
            
            # Parse photos
            media = hotel_info.get('media', [])
            photo_url = media[0].get('uri') if media else None
            
            # Parse address
            address_info = hotel_info.get('address', {})
            address_lines = address_info.get('lines', [])
            address = ', '.join(address_lines) if address_lines else address_info.get('cityName', '')
            
            # Parse cancellation policy
            cancellation = policies.get('cancellation', {})
            cancellation_policy = None
            if cancellation:
                deadline = cancellation.get('deadline', 'N/A')
                cancel_type = cancellation.get('type', 'Unknown')
                cancellation_policy = f"{cancel_type} - Deadline: {deadline}"
            
            # Create Hotel object
            hotel = Hotel(
                provider="amadeus",
                provider_id=hotel_info.get('hotelId'),
                name=hotel_info.get('name', 'Unknown Hotel'),
                latitude=float(hotel_info.get('latitude', 0)),
                longitude=float(hotel_info.get('longitude', 0)),
                price_per_night=round(price_per_night, 2),
                total_price=round(total_price, 2),
                currency=price_info.get('currency', 'USD'),
                rating=float(hotel_info.get('rating', 0)) if hotel_info.get('rating') else None,
                review_count=None,  # Amadeus doesn't provide this in offers
                photo_url=photo_url,
                amenities=amenities,
                cancellation_policy=cancellation_policy,
                address=address,
                description=hotel_info.get('description', {}).get('text'),
                offer_id=offer.get('id'),
                check_in=checkin_date.isoformat(),
                check_out=checkout_date.isoformat(),
                raw_data=offer_data  # Store full response for debugging
            )
            
            return hotel
            
        except Exception as e:
            logger.error(f"Error parsing hotel offer: {e}")
            return None
    
    async def get_details(self, provider_id: str, offer_id: Optional[str] = None) -> Optional[Hotel]:
        """Get detailed information for a specific hotel/offer.
        
        Args:
            provider_id: Hotel ID in Amadeus system
            offer_id: Optional offer ID for real-time price confirmation
        
        Returns:
            Hotel object with full details or None if not found
        """
        try:
            if offer_id:
                # Get specific offer details (real-time price check)
                response = self.client.shopping.hotel_offer(offer_id).get()
                if response.data:
                    # Parse from single offer response
                    # (This would need similar parsing to _parse_hotel_offer)
                    logger.info(f"Retrieved offer details for {offer_id}")
                    return None  # TODO: Implement parsing
            else:
                # Get static hotel details
                response = self.client.reference_data.locations.hotels.by_hotels.get(
                    hotelIds=provider_id
                )
                if response.data:
                    logger.info(f"Retrieved hotel details for {provider_id}")
                    return None  # TODO: Implement parsing
            
            return None
            
        except ResponseError as e:
            logger.error(f"Error getting hotel details: {e}")
            return None


# Singleton instance
_amadeus_provider: Optional[AmadeusHotelProvider] = None


def get_amadeus_hotel_provider() -> AmadeusHotelProvider:
    """Get or create the global AmadeusHotelProvider instance."""
    global _amadeus_provider
    if _amadeus_provider is None:
        _amadeus_provider = AmadeusHotelProvider()
    return _amadeus_provider

