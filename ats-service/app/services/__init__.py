"""
Services Package

Business logic layer for the ATS service.
Contains all core functionality for parsing, extraction, and scoring.

ATS Pipeline:
  Resume Input
    ↓
  Text Extraction   → resume_parser
    ↓
  Skill Extraction  → skill_extractor
    ↓
  Score Computation → scoring_engine
"""

from app.services.resume_parser import (
    safe_extract_text,
    find_section,
    extract_contact_info,
    extract_text_from_docx_bytes
)

from app.services.skill_extractor import (
    extract_skills_from_section,
    extract_skills_from_resume,
    extract_keywords,
    normalize_skill,
    deduplicate_skills
)

from app.services.scoring_engine import (
    compute_relevance_tfidf,
    ats_similarity_score_sbert,
    compute_heuristics,
    normalize_score,
    generate_white_box_feedback
)

__all__ = [
    # resume_parser
    'safe_extract_text',
    'find_section',
    'extract_contact_info',
    'extract_text_from_docx_bytes',

    # skill_extractor
    'extract_skills_from_section',
    'extract_skills_from_resume',
    'extract_keywords',
    'normalize_skill',
    'deduplicate_skills',

    # scoring_engine
    'compute_relevance_tfidf',
    'ats_similarity_score_sbert',
    'compute_heuristics',
    'normalize_score',
    'generate_white_box_feedback'
]
