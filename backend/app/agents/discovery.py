"""Discovery Agent - Discovers and scores POIs based on trip constraints."""
import logging
from typing import Optional

from app.models.state import TripConstraints, POI
from app.tools.places import discover_places
from app.tools.scoring import score_poi

logger = logging.getLogger(__name__)


# Mapping from vibes to place types
VIBE_TO_PLACE_TYPES = {
    "cultural": ["museum", "art_gallery", "tourist_attraction", "historical_site"],
    "adventurous": ["park", "natural_feature", "tourist_attraction", "amusement_park"],
    "relaxed": ["spa", "park", "cafe", "beach"],
    "family": ["zoo", "aquarium", "amusement_park", "park"],
    "romantic": ["restaurant", "park", "tourist_attraction", "spa"],
    "party": ["night_club", "bar", "restaurant"],
    "foodie": ["restaurant", "cafe", "bakery", "food"],
    "shopping": ["shopping_mall", "store", "market"],
    "beach": ["beach", "water_park"],
    "nature": ["park", "natural_feature", "campground"],
    "urban": ["tourist_attraction", "museum", "restaurant", "shopping_mall"]
}


def get_place_types_for_vibe(vibe: Optional[str]) -> list[str]:
    """Determine which place types to search based on the trip vibe."""
    if not vibe:
        return ["tourist_attraction", "museum", "restaurant"]  # Default
    
    vibe_lower = vibe.lower()
    
    # Check for exact match
    if vibe_lower in VIBE_TO_PLACE_TYPES:
        return VIBE_TO_PLACE_TYPES[vibe_lower]
    
    # Check for partial matches
    for key, types in VIBE_TO_PLACE_TYPES.items():
        if key in vibe_lower or vibe_lower in key:
            return types
    
    # Default fallback
    return ["tourist_attraction", "museum", "restaurant"]


def discovery_agent(constraints: TripConstraints) -> dict:
    """
    Discovery Agent: Find and score POIs based on trip constraints.
    
    This agent:
    1. Determines what types of places to search for based on the vibe
    2. Discovers POIs using the Google Places API
    3. Scores each POI based on user constraints
    4. Returns the top-ranked POIs
    
    Args:
        constraints: Trip constraints from the Intake Agent
        
    Returns:
        Dictionary with:
        - potential_pois: List of scored POI dicts
        - discovery_summary: Summary string
        - error_message: Error message if something went wrong
    """
    try:
        destination = constraints.get('destination')
        if not destination:
            logger.warning("No destination provided to Discovery Agent")
            return {
                "potential_pois": [],
                "discovery_summary": "No destination specified",
                "error_message": "Please specify a destination"
            }
        
        vibe = constraints.get('vibe')
        budget = constraints.get('budget', 'moderate')
        must_see = constraints.get('must_see', [])
        
        logger.info(f"Starting discovery for {destination} with vibe: {vibe}")
        
        # Determine place types to search
        place_types = get_place_types_for_vibe(vibe)
        logger.info(f"Searching for place types: {place_types}")
        
        # Discover POIs for each type
        all_pois = []
        search_radius = 5000  # 5km radius
        
        for place_type in place_types:
            try:
                pois = discover_places.invoke({
                    "location": destination,
                    "place_type": place_type,
                    "radius_meters": search_radius
                })
                if pois:
                    logger.info(f"Found {len(pois)} {place_type} places")
                    all_pois.extend(pois)
            except Exception as e:
                logger.error(f"Error discovering {place_type} places: {e}")
                continue
        
        if not all_pois:
            logger.warning(f"No POIs found for {destination}")
            return {
                "potential_pois": [],
                "discovery_summary": f"No places found in {destination}",
                "error_message": "Could not find any places matching your preferences"
            }
        
        # Remove duplicates by place_id
        unique_pois_dict = {poi['place_id']: poi for poi in all_pois if poi.get('place_id')}
        unique_pois = list(unique_pois_dict.values())
        logger.info(f"Found {len(unique_pois)} unique POIs after deduplication")
        
        # Score each POI
        scored_pois = []
        for poi in unique_pois:
            try:
                scored = score_poi.invoke({
                    "poi": poi,
                    "user_constraints": {"budget": budget}
                })
                scored_pois.append(scored)
            except Exception as e:
                logger.error(f"Error scoring POI {poi.get('name')}: {e}")
                # Add with default score
                poi['ai_score'] = 50.0
                poi['score_breakdown'] = {}
                poi['recommendation_reason'] = "Good match for your trip."
                scored_pois.append(poi)
        
        # Sort by AI score (highest first)
        scored_pois.sort(key=lambda x: x.get('ai_score', 0), reverse=True)
        
        # Return top 30 POIs
        top_pois = scored_pois[:30]
        
        # Create summary
        top_score = top_pois[0].get('ai_score', 0) if top_pois else 0
        summary = (
            f"Found {len(top_pois)} highly-rated places in {destination}. "
            f"Top recommendation: {top_pois[0].get('name')} (score: {top_score:.1f})"
        ) if top_pois else f"Found some places in {destination}"
        
        logger.info(f"Discovery complete: returning {len(top_pois)} POIs")
        
        return {
            "potential_pois": top_pois,
            "discovery_summary": summary,
            "error_message": None
        }
        
    except Exception as e:
        logger.error(f"Unexpected error in Discovery Agent: {e}")
        return {
            "potential_pois": [],
            "discovery_summary": "An error occurred during discovery",
            "error_message": str(e)
        }


def filter_pois_by_must_see(pois: list[POI], must_see: list[str]) -> list[POI]:
    """
    Filter or boost POIs that match must-see requirements.
    
    Args:
        pois: List of POIs
        must_see: List of must-see items from user
        
    Returns:
        Filtered/boosted list of POIs
    """
    if not must_see:
        return pois
    
    # Create lowercase versions for matching
    must_see_lower = [item.lower() for item in must_see]
    
    boosted_pois = []
    for poi in pois:
        name = poi.get('name', '').lower()
        types = [t.lower() for t in poi.get('types', [])]
        
        # Check if POI matches any must-see item
        matches = False
        for must_see_item in must_see_lower:
            if must_see_item in name or any(must_see_item in t for t in types):
                matches = True
                # Boost the score
                current_score = poi.get('ai_score', 50)
                poi['ai_score'] = min(100, current_score + 15)  # Add 15 points, max 100
                logger.info(f"Boosted '{poi.get('name')}' for matching must-see: {must_see_item}")
                break
        
        boosted_pois.append(poi)
    
    # Re-sort after boosting
    boosted_pois.sort(key=lambda x: x.get('ai_score', 0), reverse=True)
    
    return boosted_pois






