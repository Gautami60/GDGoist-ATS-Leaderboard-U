"""
Response Schema Models

This module defines the structure of API responses.
Using Pydantic models ensures:
- Type safety
- Automatic validation
- Clear API documentation
- Consistent response format

All API endpoints should return data matching these schemas.
"""

from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field


class ContactInfo(BaseModel):
    """
    Contact information extracted from resume.
    """
    email: Optional[str] = Field(None, description="Email address found in resume")
    phone: Optional[str] = Field(None, description="Phone number found in resume")


class ScoreBreakdown(BaseModel):
    """
    Detailed breakdown of how the ATS score was calculated.
    
    This provides transparency into the scoring algorithm.
    """
    education: float = Field(0.0, description="Points from education section (0-12)")
    experience: float = Field(0.0, description="Points from experience section (0-18)")
    skills: float = Field(0.0, description="Points from skills section (0-10)")
    contact: float = Field(0.0, description="Points from contact info (0-10)")
    formattingPenalty: float = Field(0.0, description="Penalty for formatting issues (-10 to 0)")
    parsingPenalty: float = Field(0.0, description="Penalty for parsing errors (-20 to 0)")
    heuristics: float = Field(0.0, description="Total heuristic score (0-50 or 0-100)")
    relevance: float = Field(0.0, description="Relevance score component (0-50)")


class ModelInfo(BaseModel):
    """
    Information about the similarity model being used.
    """
    sbert_enabled: bool = Field(False, description="Whether SBERT is enabled")
    model_name: str = Field("TF-IDF", description="Name of the similarity model")


class ParsedSections(BaseModel):
    """
    Sections extracted from the resume.
    """
    education: Optional[str] = Field(None, description="Education section content")
    experience: Optional[str] = Field(None, description="Experience section content")
    skills: List[str] = Field(default_factory=list, description="List of extracted skills")


class ATSScoreResponse(BaseModel):
    """
    Complete ATS scoring response.
    
    This is the main response returned by the /parse endpoint.
    It contains everything needed to understand the resume analysis.
    """
    rawText: str = Field(..., description="Full text extracted from resume")
    parsedSkills: List[str] = Field(default_factory=list, description="List of skills extracted")
    parsingErrors: List[str] = Field(default_factory=list, description="Errors encountered during parsing")
    atsScore: float = Field(..., description="Final ATS score (0-100)")
    breakdown: Dict[str, float] = Field(default_factory=dict, description="Score breakdown by component")
    feedback: List[str] = Field(default_factory=list, description="Actionable feedback and recommendations")
    contact: Dict[str, Optional[str]] = Field(default_factory=dict, description="Contact information")
    similarity_method: str = Field("TF-IDF", description="Method used for similarity calculation")
    model_info: Dict[str, Any] = Field(default_factory=dict, description="Information about the model used")
    
    class Config:
        schema_extra = {
            "example": {
                "rawText": "John Doe\\nSoftware Engineer\\n...",
                "parsedSkills": ["Python", "JavaScript", "React"],
                "parsingErrors": [],
                "atsScore": 85.5,
                "breakdown": {
                    "education": 12,
                    "experience": 18,
                    "skills": 10,
                    "contact": 10,
                    "formattingPenalty": 0,
                    "parsingPenalty": 0,
                    "heuristics": 50,
                    "relevance": 35.5
                },
                "feedback": [
                    "Education section detected",
                    "Experience section detected",
                    "Skills section detected",
                    "Email found: john@example.com",
                    "Excellent semantic match to job description"
                ],
                "contact": {
                    "email": "john@example.com",
                    "phone": "+1-555-1234"
                },
                "similarity_method": "TF-IDF",
                "model_info": {
                    "sbert_enabled": False,
                    "model_name": "TF-IDF"
                }
            }
        }


class SimilarityResponse(BaseModel):
    """
    Response for similarity calculation endpoints.
    """
    similarity: float = Field(..., description="Similarity score (0-1)")
    method: str = Field("TF-IDF", description="Method used for calculation")
    model: str = Field("TF-IDF", description="Model name")
    
    class Config:
        schema_extra = {
            "example": {
                "similarity": 0.75,
                "method": "TF-IDF",
                "model": "TF-IDF"
            }
        }


class DetailedSimilarityResponse(BaseModel):
    """
    Detailed response for similarity calculation with additional metadata.
    """
    similarity_score: float = Field(..., description="Similarity score (0-1)")
    method: str = Field("TF-IDF", description="Method used for calculation")
    model: str = Field("TF-IDF", description="Model name")
    resume_length: int = Field(..., description="Length of resume text in characters")
    jd_length: int = Field(..., description="Length of job description in characters")
    
    class Config:
        schema_extra = {
            "example": {
                "similarity_score": 0.75,
                "method": "TF-IDF",
                "model": "TF-IDF",
                "resume_length": 2500,
                "jd_length": 800
            }
        }


class HealthResponse(BaseModel):
    """
    Health check response.
    """
    status: str = Field("ok", description="Service status")
    sbert_enabled: bool = Field(False, description="Whether SBERT is enabled")
    model: str = Field("TF-IDF", description="Active model name")
    
    class Config:
        schema_extra = {
            "example": {
                "status": "ok",
                "sbert_enabled": False,
                "model": "TF-IDF"
            }
        }


class ErrorResponse(BaseModel):
    """
    Error response format.
    """
    error: str = Field(..., description="Error message")
    detail: str = Field(..., description="Detailed error information")
    
    class Config:
        schema_extra = {
            "example": {
                "error": "Failed to parse",
                "detail": "Unsupported file format"
            }
        }
