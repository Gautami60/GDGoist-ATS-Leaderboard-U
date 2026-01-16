"""
ATS Service Application Package

This package contains the core ATS (Applicant Tracking System) service.
It provides resume parsing, skill extraction, and scoring capabilities.

Architecture:
- routes/: HTTP endpoint handlers
- services/: Business logic (parsing, extraction, scoring)
- utils/: Helper functions (text cleaning, etc.)
- models/: Data schemas and response structures
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import nltk
from nltk.corpus import stopwords

# Global configuration
SBERT_ENABLED = False
sbert_model = None
STOP_WORDS = set()


def initialize_nlp_resources():
    """
    Initialize NLP resources like stopwords and SBERT model.
    
    This function is called once when the application starts.
    It downloads necessary NLTK data and attempts to load the SBERT model.
    
    Returns:
        tuple: (sbert_model, SBERT_ENABLED, STOP_WORDS)
    """
    global sbert_model, SBERT_ENABLED, STOP_WORDS
    
    try:
        # Download stopwords if not already present
        nltk.download('stopwords', quiet=True)
        STOP_WORDS = set(stopwords.words('english'))
        
        # SBERT model loading disabled on Windows due to Numpy compatibility issues
        print("SBERT model loading disabled on Windows (Numpy compatibility)")
        sbert_model = None
        SBERT_ENABLED = False
        
    except Exception as e:
        print(f"Warning: Could not initialize SBERT model: {e}")
        print("Falling back to TF-IDF similarity")
        STOP_WORDS = set()
        sbert_model = None
        SBERT_ENABLED = False
    
    return sbert_model, SBERT_ENABLED, STOP_WORDS


def create_app() -> FastAPI:
    """
    Factory function to create and configure the FastAPI application.
    
    This function:
    1. Creates a FastAPI instance
    2. Configures CORS middleware for cross-origin requests
    3. Initializes NLP resources
    4. Registers all routes
    
    Returns:
        FastAPI: Configured FastAPI application instance
    """
    # Create FastAPI app
    app = FastAPI(
        title="ATS Service with TF-IDF",
        description="Resume parsing and scoring service for Applicant Tracking System",
        version="2.0.0"
    )
    
    # Configure CORS - allows frontend to communicate with this service
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",  # Vite dev server
            "http://localhost:3000",  # React dev server
            "*"  # Allow all origins (adjust in production)
        ],
        allow_credentials=True,
        allow_methods=["*"],  # Allow all HTTP methods
        allow_headers=["*"],  # Allow all headers
    )
    
    # Initialize NLP resources
    initialize_nlp_resources()
    
    # Register routes
    from app.routes import score
    app.include_router(score.router)
    
    return app
