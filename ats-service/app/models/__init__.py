"""
Models Package

Data models and schemas for API requests and responses.
"""

from app.models.response_schema import (
    ContactInfo,
    ScoreBreakdown,
    ModelInfo,
    ParsedSections,
    ATSScoreResponse,
    SimilarityResponse,
    DetailedSimilarityResponse,
    HealthResponse,
    ErrorResponse
)

from app.models.request_schema import (
    ResumeScoreRequest,
    ResumeTextRequest
)

__all__ = [
    # Response schemas
    'ContactInfo',
    'ScoreBreakdown',
    'ModelInfo',
    'ParsedSections',
    'ATSScoreResponse',
    'SimilarityResponse',
    'DetailedSimilarityResponse',
    'HealthResponse',
    'ErrorResponse',
    # Request schemas
    'ResumeScoreRequest',
    'ResumeTextRequest',
]
