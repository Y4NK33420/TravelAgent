"""Application configuration management using pydantic-settings."""
import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Google API Keys
    google_maps_api_key: str
    gemini_api_key: str
    
    # Amadeus API (Phase 2.3)
    amadeus_api_key: str
    amadeus_api_secret: str
    amadeus_base_url: str = "https://test.api.amadeus.com"  # or https://api.amadeus.com for production
    
    # SerpAPI (Phase 2.3 - Week 5)
    serpapi_api_key: str = "demo"  # Default demo key
    
    # Environment
    environment: str = "development"
    log_level: str = "INFO"
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    
    # CORS
    cors_origins: list[str] = [
        "http://localhost:3000", 
        "http://localhost:5173",
        "http://localhost:5174"
    ]
    
    # Database (Phase 2.2)
    database_host: str = "localhost"
    database_port: int = 5433  # Changed from 5432 to avoid conflicts with local PostgreSQL
    database_name: str = "travel_agent"
    database_user: str = "postgres"
    database_password: str = "postgres"
    
    # Vector Database - Pinecone (Phase 2.2)
    pinecone_api_key: str = "your-pinecone-api-key"
    pinecone_environment: str = "gcp-starter"  # Free tier
    pinecone_index_name: str = "travel-agent-pois"
    
    # Redis Cache (Phase 2.4)
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0
    
    # Authentication (Phase 2.2)
    jwt_secret_key: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 60 * 24 * 7  # 7 days
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )


# Global settings instance
settings = Settings()

