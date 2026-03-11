"""
Request Validation Schemas

This module defines Pydantic models that describe the expected shape of
incoming API request bodies.  They add type safety and automatic validation
without touching any business logic.

Key models:
- ResumeScoreRequest  – optional job description for the /parse endpoint
- ResumeTextRequest   – two plain-text inputs for similarity endpoints

Note: The /parse endpoint uses multipart file upload (FastAPI UploadFile),
so these models are not wired directly into that route's signature.  They
serve as authoritative schema documentation and can be used by future
JSON-body variants of the endpoints.
"""

from typing import Optional
from pydantic import BaseModel, Field


class ResumeScoreRequest(BaseModel):
    """
    Optional metadata that may accompany a resume scoring request.

    The actual resume file is uploaded via multipart/form-data.
    This model captures the optional job description that can be
    supplied alongside the file upload.
    """

    job_description: Optional[str] = Field(
        None,
        description=(
            "Job description text used to compute relevance score. "
            "When omitted, only the heuristic score is calculated."
        ),
        example="Looking for a Python backend engineer with FastAPI and Docker experience.",
    )


class ResumeTextRequest(BaseModel):
    """
    Plain-text inputs for the semantic similarity endpoints.

    Used by:
    - POST /semantic-similarity
    - POST /similarity
    """

    text1: str = Field(
        ...,
        description="First text (e.g., resume text).",
        min_length=1,
        example="Experienced Python developer with 3 years working on FastAPI services.",
    )
    text2: str = Field(
        ...,
        description="Second text (e.g., job description).",
        min_length=1,
        example="We are hiring a Python backend developer with FastAPI experience.",
    )

    class Config:
        schema_extra = {
            "example": {
                "text1": "Experienced Python developer with 3 years of FastAPI experience.",
                "text2": "We are hiring a Python backend developer with FastAPI and Docker skills.",
            }
        }
