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

__all__ = [
    'ContactInfo',
    'ScoreBreakdown',
    'ModelInfo',
    'ParsedSections',
    'ATSScoreResponse',
    'SimilarityResponse',
    'DetailedSimilarityResponse',
    'HealthResponse',
    'ErrorResponse'
]
