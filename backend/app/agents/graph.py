"""LangGraph workflow orchestration for the travel agent.

This module defines the graph structure that connects the Intake and Discovery
agents into a cohesive planning workflow.
"""
import logging
from typing import Optional
from langchain_core.messages import HumanMessage, AIMessage
from langgraph.graph import StateGraph, END

from app.models.state import TravelAgentState
from app.agents.intake import extract_constraints
from app.agents.discovery import discovery_agent, filter_pois_by_must_see
from app.agents.optimizer import optimize_itinerary_node
from app.agents.accommodation import accommodation_agent_node
from app.agents.transport import transport_agent_node
from app.tools.geocoding import geocode_location

logger = logging.getLogger(__name__)


def intake_node(state: TravelAgentState) -> dict:
    """
    Intake Node: Extract trip constraints from user message.
    
    This node uses the Intake Agent to parse the user's natural language
    input and extract structured trip constraints.
    """
    try:
        messages = state.get('messages', [])
        if not messages:
            logger.error("No messages in state for intake node")
            return {
                "error_message": "No user message provided",
                "current_stage": "error"
            }
        
        # Get the last user message
        last_message = messages[-1]
        if hasattr(last_message, 'content'):
            user_text = last_message.content
        else:
            user_text = str(last_message)
        
        logger.info(f"Intake node processing message: {user_text[:100]}...")
        
        # Extract constraints using Intake Agent
        constraints = extract_constraints(user_text)
        
        if not constraints:
            logger.error("Failed to extract constraints")
            return {
                "error_message": "Could not understand trip requirements. Please provide destination and preferences.",
                "current_stage": "error"
            }
        
        logger.info(f"Successfully extracted constraints for: {constraints.get('destination')}")
        
        # Geocode the destination
        destination = constraints.get('destination')
        destination_coords = None
        if destination:
            try:
                coords = geocode_location.invoke({"location": destination})
                if coords and 'error' not in coords:
                    destination_coords = coords
                    logger.info(f"Geocoded destination: {destination}")
            except Exception as e:
                logger.warning(f"Could not geocode destination: {e}")
        
        # Add AI message to conversation
        ai_response = AIMessage(
            content=f"Great! I'll help you plan your trip to {destination}. "
                    f"Let me find the best places for you..."
        )
        
        return {
            "messages": [ai_response],
            "constraints": constraints,
            "destination_coords": destination_coords,
            "current_stage": "intake_complete",
            "error_message": None
        }
        
    except Exception as e:
        logger.error(f"Error in intake node: {e}")
        return {
            "error_message": f"Error processing your request: {str(e)}",
            "current_stage": "error"
        }


def discovery_node(state: TravelAgentState) -> dict:
    """
    Discovery Node: Find and score POIs based on constraints.
    
    This node uses the Discovery Agent to search for places and score them
    based on the user's preferences.
    """
    try:
        constraints = state.get('constraints')
        if not constraints:
            logger.error("No constraints in state for discovery node")
            return {
                "error_message": "Missing trip constraints",
                "current_stage": "error"
            }
        
        logger.info("Discovery node starting POI search...")
        
        # Run discovery agent
        result = discovery_agent(constraints)
        
        potential_pois = result.get('potential_pois', [])
        error_message = result.get('error_message')
        
        if error_message:
            logger.error(f"Discovery agent error: {error_message}")
            return {
                "error_message": error_message,
                "current_stage": "error"
            }
        
        if not potential_pois:
            logger.warning("No POIs found by discovery agent")
            return {
                "potential_pois": [],
                "error_message": "Could not find any places matching your preferences",
                "current_stage": "discovery_complete"
            }
        
        # Apply must-see filtering/boosting
        must_see = constraints.get('must_see', [])
        if must_see:
            potential_pois = filter_pois_by_must_see(potential_pois, must_see)
        
        logger.info(f"Discovery complete: found {len(potential_pois)} POIs")
        
        # Create response message
        top_places = [poi.get('name') for poi in potential_pois[:5]]
        ai_response = AIMessage(
            content=f"I found {len(potential_pois)} great places for you! "
                    f"Top recommendations include: {', '.join(top_places)}."
        )
        
        return {
            "messages": [ai_response],
            "potential_pois": potential_pois,
            "current_stage": "discovery_complete",
            "error_message": None
        }
        
    except Exception as e:
        logger.error(f"Error in discovery node: {e}")
        return {
            "error_message": f"Error discovering places: {str(e)}",
            "current_stage": "error"
        }


def should_continue(state: TravelAgentState) -> str:
    """
    Determine the next node in the workflow based on current stage.
    
    Args:
        state: Current travel agent state
        
    Returns:
        Next node name or 'end' to terminate
    """
    current_stage = state.get('current_stage', 'start')
    
    logger.info(f"Routing decision: current_stage='{current_stage}'")
    
    # Route based on stage (Phase 2.3: Extended workflow)
    if current_stage == 'intake_complete':
        return 'discovery'
    elif current_stage == 'discovery_complete':
        # Phase 2: Route to optimizer after discovery
        return 'optimizer'
    elif current_stage == 'optimization_complete':
        # Phase 2.3: Route to accommodation after optimization
        return 'accommodation'
    elif current_stage == 'optimization_retry':
        # Retry optimization with adjusted parameters
        return 'optimizer'
    elif current_stage == 'accommodation_complete':
        # Phase 2.3: Route to transport after accommodation
        return 'transport'
    elif current_stage == 'transport_complete':
        # Complete trip planning
        return 'end'
    elif current_stage in ['complete', 'no_pois', 'needs_user_clarification',
                          'needs_user_input_for_constraints', 'error', 'optimization_failed']:
        return 'end'
    else:
        # Default to end for unknown stages
        logger.warning(f"Unknown stage '{current_stage}', routing to END")
        return 'end'


# Build the LangGraph workflow
def build_travel_agent_graph():
    """
    Construct the LangGraph workflow for the travel agent.
    
    Graph structure (Phase 2.3 - Complete):
        START -> intake -> discovery -> optimizer -> accommodation -> transport -> END
                                            ↓ (retry)
                                         optimizer
    
    Phase 2.3 Additions:
    - Accommodation Agent: Finds and scores hotels based on POI locations
    - Transport Agent: Plans flights and local transport
    
    Returns:
        Compiled LangGraph application
    """
    logger.info("Building travel agent graph (Phase 2.3 - Complete workflow)...")
    
    # Create the state graph
    workflow = StateGraph(TravelAgentState)
    
    # Add nodes (Phase 2.3: All agents)
    workflow.add_node("intake", intake_node)
    workflow.add_node("discovery", discovery_node)
    workflow.add_node("optimizer", optimize_itinerary_node)
    workflow.add_node("accommodation", accommodation_agent_node)  # Phase 2.3
    workflow.add_node("transport", transport_agent_node)  # Phase 2.3
    
    # Set entry point
    workflow.set_entry_point("intake")
    
    # Add conditional edges from intake
    workflow.add_conditional_edges(
        "intake",
        should_continue,
        {
            "discovery": "discovery",
            "end": END
        }
    )
    
    # Add conditional edges from discovery
    workflow.add_conditional_edges(
        "discovery",
        should_continue,
        {
            "optimizer": "optimizer",
            "end": END
        }
    )
    
    # Add conditional edges from optimizer
    workflow.add_conditional_edges(
        "optimizer",
        should_continue,
        {
            "optimizer": "optimizer",  # Retry with adjusted params
            "accommodation": "accommodation",  # Phase 2.3: Next step
            "end": END
        }
    )
    
    # Phase 2.3: Add conditional edges from accommodation
    workflow.add_conditional_edges(
        "accommodation",
        should_continue,
        {
            "transport": "transport",
            "end": END
        }
    )
    
    # Phase 2.3: Add conditional edges from transport (final step)
    workflow.add_conditional_edges(
        "transport",
        should_continue,
        {
            "end": END
        }
    )
    
    # Compile the graph
    app = workflow.compile()
    
    logger.info("Travel agent graph compiled successfully (Phase 2.3 complete workflow)")
    
    return app


# Create the global graph instance
travel_agent_graph: Optional[StateGraph] = None


def get_travel_agent_graph():
    """Get or create the global travel agent graph instance."""
    global travel_agent_graph
    if travel_agent_graph is None:
        travel_agent_graph = build_travel_agent_graph()
    return travel_agent_graph

