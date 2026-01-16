"""
Services Package

Business logic layer for the ATS service.
Contains all core functionality for parsing, extraction, and scoring.
"""

from app.services.parser import (
    safe_extract_text,
    find_section,
    extract_contact_info,
    extract_text_from_docx_bytes
)

from app.services.extractor import (
    extract_skills_from_section,
    extract_keywords,
    normalize_skill,
    deduplicate_skills
)

from app.services.scorer import (
    compute_relevance_tfidf,
    ats_similarity_score_sbert,
    compute_heuristics,
    normalize_score,
    generate_white_box_feedback
)

__all__ = [
    # Parser
    'safe_extract_text',
    'find_section',
    'extract_contact_info',
    'extract_text_from_docx_bytes',
    
    # Extractor
    'extract_skills_from_section',
    'extract_keywords',
    'normalize_skill',
    'deduplicate_skills',
    
    # Scorer
    'compute_relevance_tfidf',
    'ats_similarity_score_sbert',
    'compute_heuristics',
    'normalize_score',
    'generate_white_box_feedback'
]
