"""
ATS Scorer Service

This module contains all scoring and similarity calculation logic.
It determines how well a resume matches a job description.

Key Responsibilities:
- Calculate semantic similarity between resume and job description
- Compute heuristic scores based on resume structure
- Generate feedback and recommendations
- Normalize final scores to 0-100 range

Scoring Components:
1. Heuristic Score (0-50): Based on resume structure and completeness
   - Education section: 12 points
   - Experience section: 18 points
   - Skills section: 10 points
   - Contact info: 10 points
   - Formatting penalties: -10 points
   - Parsing error penalties: -20 points

2. Relevance Score (0-50): Based on similarity to job description
   - Uses TF-IDF or SBERT for semantic matching
   - Converted to 0-50 scale

Total Score: Heuristic + Relevance = 0-100
"""

from typing import Optional, Tuple, Dict, List, Any
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.utils.text_cleaner import clean_text, detect_formatting_risks


def compute_relevance_tfidf(resume_text: str, job_text: str) -> float:
    """
    Calculate semantic similarity using TF-IDF (Term Frequency-Inverse Document Frequency).
    
    TF-IDF is a statistical method that measures how important a word is to a document.
    It works by:
    1. Converting both texts into numerical vectors
    2. Calculating cosine similarity between vectors
    3. Returning a score between 0 (no match) and 1 (perfect match)
    
    This is the fallback method when SBERT is not available.
    
    Args:
        resume_text (str): Full resume text
        job_text (str): Job description text
    
    Returns:
        float: Similarity score between 0.0 and 1.0
    
    Example:
        >>> compute_relevance_tfidf("Python developer with 5 years experience", 
        ...                          "Looking for Python developer")
        0.65  # High similarity due to matching keywords
    """
    try:
        # Create TF-IDF vectorizer with English stopword removal
        vect = TfidfVectorizer(stop_words='english')
        
        # Fit and transform both texts
        # Order: [job_description, resume]
        tfidf = vect.fit_transform([job_text or '', resume_text or ''])
        
        # Ensure we have at least 2 documents
        if tfidf.shape[0] < 2:
            return 0.0
        
        # Calculate cosine similarity between job description and resume
        sim = cosine_similarity(tfidf[0:1], tfidf[1:2])[0, 0]
        
        # Handle NaN values
        if np.isnan(sim):
            return 0.0
        
        return float(sim)
    
    except Exception:
        return 0.0


def ats_similarity_score_sbert(resume_text: str, jd_text: str, 
                                sbert_model=None, sbert_enabled: bool = False,
                                stop_words: set = None) -> float:
    """
    Calculate ATS similarity using SBERT (Sentence-BERT) or TF-IDF fallback.
    
    SBERT is a more advanced semantic similarity method that understands
    the meaning of sentences, not just keyword matching.
    
    When SBERT is not available (e.g., on Windows), falls back to TF-IDF.
    
    Args:
        resume_text (str): Full resume text
        jd_text (str): Job description text
        sbert_model: SBERT model instance (or None)
        sbert_enabled (bool): Whether SBERT is available
        stop_words (set): Set of stopwords for text cleaning
    
    Returns:
        float: Similarity score between 0.0 and 1.0
    """
    # If SBERT is not enabled, use TF-IDF fallback
    if not sbert_enabled or not sbert_model:
        return compute_relevance_tfidf(resume_text, jd_text)
    
    try:
        # Clean inputs (remove stopwords, special chars, etc.)
        resume_clean = clean_text(resume_text, stop_words)
        jd_clean = clean_text(jd_text, stop_words)
        
        # Ensure both texts have content
        if not resume_clean or not jd_clean:
            return 0.0
        
        # Generate embeddings (numerical representations of text meaning)
        resume_embedding = sbert_model.encode([resume_clean])
        jd_embedding = sbert_model.encode([jd_clean])
        
        # Calculate cosine similarity
        similarity = cosine_similarity(resume_embedding, jd_embedding)[0][0]
        
        # Ensure similarity is between 0 and 1
        similarity = max(0.0, min(1.0, float(similarity)))
        
        return similarity
    
    except Exception as e:
        print(f"SBERT similarity calculation failed: {e}")
        # Fallback to TF-IDF
        return compute_relevance_tfidf(resume_text, jd_text)


def compute_heuristics(text: str, parsed_sections: dict, 
                       parsing_errors: List[str]) -> Tuple[float, List[str], Dict[str, float]]:
    """
    Compute heuristic score based on resume structure and completeness.
    
    This function evaluates the resume's quality independent of job matching:
    - Does it have all expected sections?
    - Is contact information present?
    - Are there formatting issues?
    - Were there parsing errors?
    
    Args:
        text (str): Full resume text
        parsed_sections (dict): Dictionary of extracted sections (education, experience, skills)
        parsing_errors (List[str]): List of errors encountered during parsing
    
    Returns:
        Tuple containing:
        - score (float): Heuristic score (0-50)
        - feedback (List[str]): List of feedback messages
        - breakdown (Dict[str, float]): Score breakdown by component
    """
    score = 0.0
    feedback = []
    breakdown = {
        'education': 0,
        'experience': 0,
        'skills': 0,
        'contact': 0,
        'formattingPenalty': 0,
        'parsingPenalty': 0
    }
    
    # Check for Education section (12 points)
    if parsed_sections.get('education'):
        breakdown['education'] = 12
        score += 12
    else:
        feedback.append('Missing Education section')
    
    # Check for Experience section (18 points - most important)
    if parsed_sections.get('experience'):
        breakdown['experience'] = 18
        score += 18
    else:
        feedback.append('Missing Experience section')
    
    # Check for Skills section (10 points)
    if parsed_sections.get('skills'):
        breakdown['skills'] = 10
        score += 10
    else:
        feedback.append('Missing Skills section')
    
    # Check for Contact information (10 points)
    from app.services.parser import extract_contact_info
    contact = extract_contact_info(text)
    if contact.get('email') or contact.get('phone'):
        breakdown['contact'] = 10
        score += 10
    else:
        feedback.append('Missing or invalid contact information')
    
    # Check for formatting risks (-10 points)
    risks = detect_formatting_risks(text)
    if risks:
        breakdown['formattingPenalty'] = -10
        score -= 10
        feedback.extend(['Formatting risk: ' + r for r in risks])
    
    # Parsing errors penalty (-20 points)
    if parsing_errors:
        breakdown['parsingPenalty'] = -20
        score -= 20
        feedback.append('Parsing issues detected: ' + '; '.join(parsing_errors))
    
    # Clamp score to [0, 50]
    score = max(0.0, min(50.0, score))
    
    return score, feedback, breakdown


def normalize_score(heuristics_score: float, 
                    relevance: Optional[float]) -> Tuple[float, Dict[str, float]]:
    """
    Normalize final ATS score to 0-100 range.
    
    Combines:
    - Heuristic score (0-50): Resume structure quality
    - Relevance score (0-50): Job description match
    
    If no job description is provided, heuristic score is doubled.
    
    Args:
        heuristics_score (float): Score from compute_heuristics (0-50)
        relevance (Optional[float]): Similarity score (0-1) or None
    
    Returns:
        Tuple containing:
        - total_score (float): Final score (0-100)
        - breakdown (Dict[str, float]): Score breakdown
    """
    if relevance is None or relevance == 0.0:
        # No job description provided - double the heuristic score
        total = heuristics_score * 2.0
        breakdown = {
            'heuristics': heuristics_score * 2.0,
            'relevance': 0.0
        }
    else:
        # Convert relevance (0-1) to 0-50 scale
        relevance_component = relevance * 50.0
        total = heuristics_score + relevance_component
        breakdown = {
            'heuristics': heuristics_score,
            'relevance': relevance_component
        }
    
    # Clamp to [0, 100]
    total = max(0.0, min(100.0, total))
    
    return round(total, 2), breakdown


def generate_white_box_feedback(feedback_items: List[str], relevance: float,
                                parsed_sections: dict, contact: dict,
                                breakdown_components: dict,
                                sbert_enabled: bool = False) -> List[str]:
    """
    Generate detailed, actionable feedback for the resume.
    
    "White box" means the feedback explains WHY the score is what it is,
    not just giving a number. This helps users improve their resumes.
    
    Args:
        feedback_items (List[str]): Initial feedback from heuristic scoring
        relevance (float): Relevance score (0-1)
        parsed_sections (dict): Extracted resume sections
        contact (dict): Extracted contact information
        breakdown_components (dict): Score breakdown
        sbert_enabled (bool): Whether SBERT was used
    
    Returns:
        List[str]: Comprehensive feedback messages
    """
    fb = []
    fb.extend(feedback_items)
    
    # Add relevance interpretation
    if relevance is not None:
        similarity_method = "SBERT" if sbert_enabled else "TF-IDF"
        fb.append(f'Relevance ({similarity_method}) = {round(relevance, 3)}')
        
        # Interpret relevance score
        if relevance < 0.3:
            fb.append('Low semantic match to job description - consider adding more relevant keywords and skills')
        elif relevance < 0.6:
            fb.append('Moderate semantic match to job description - good alignment with some improvement opportunities')
        else:
            fb.append('Excellent semantic match to job description - strong alignment with requirements')
    
    # Section summary
    for sec in ['education', 'experience', 'skills']:
        if parsed_sections.get(sec):
            fb.append(f'{sec.title()} section detected')
        else:
            fb.append(f'{sec.title()} section NOT detected - consider adding this section')
    
    # Contact information feedback
    if contact.get('email'):
        fb.append(f"Email found: {contact.get('email')}")
    else:
        fb.append('Email not found - add professional email address')
    
    if contact.get('phone'):
        fb.append(f"Phone found: {contact.get('phone')}")
    else:
        fb.append('Phone not found - add contact phone number')
    
    # Append breakdown summary
    fb.append('Score breakdown: ' + ', '.join([f"{k}:{v}" for k, v in breakdown_components.items()]))
    
    # Add SBERT-specific recommendations
    if sbert_enabled and relevance is not None:
        if relevance < 0.4:
            fb.append('Recommendation: Use more specific technical terms and industry keywords from the job description')
            fb.append('Recommendation: Align your experience descriptions with the job requirements more closely')
    
    return fb
