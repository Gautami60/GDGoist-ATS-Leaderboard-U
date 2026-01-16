"""
Skill Extractor Service

This module extracts skills and keywords from resume text.
It focuses on identifying technical skills, tools, and technologies.

Key Responsibilities:
- Extract skills from a dedicated "Skills" section
- Parse comma/newline-separated skill lists
- Filter out noise and invalid entries
"""

import re
from typing import List, Optional


def extract_skills_from_section(section_text: Optional[str]) -> List[str]:
    """
    Extract individual skills from a skills section.
    
    Skills sections in resumes typically list skills separated by:
    - Commas: "Python, Java, JavaScript"
    - Newlines: "Python\\nJava\\nJavaScript"
    - Bullets: "• Python • Java • JavaScript"
    - Semicolons: "Python; Java; JavaScript"
    
    This function:
    1. Splits the section by common delimiters
    2. Cleans up each skill (removes whitespace)
    3. Filters out invalid entries (too short or too long)
    
    Args:
        section_text (Optional[str]): Text from the skills section (or None if not found)
    
    Returns:
        List[str]: List of extracted skills
    
    Example:
        >>> extract_skills_from_section("Python, Java, React.js, Docker")
        ['Python', 'Java', 'React.js', 'Docker']
        
        >>> extract_skills_from_section("• Python\\n• Machine Learning\\n• AWS")
        ['Python', 'Machine Learning', 'AWS']
    """
    if not section_text:
        return []
    
    # Split by common delimiters:
    # - Newlines (\n)
    # - Commas (,)
    # - Semicolons (;)
    # - Bullet points (• or \u2022)
    tokens = re.split(r'[\n,;•\u2022]+', section_text)
    
    skills = []
    for t in tokens:
        # Clean up whitespace
        s = t.strip()
        
        # Filter: skill should be between 2 and 60 characters
        # This removes:
        # - Single characters (likely noise)
        # - Very long strings (likely full sentences, not skills)
        if 2 <= len(s) <= 60:
            skills.append(s)
    
    return skills


def extract_keywords(text: str, min_length: int = 3, max_length: int = 30) -> List[str]:
    """
    Extract potential keywords from any text.
    
    This is a more general extraction function that can be used on
    any section of the resume (not just the skills section).
    
    It extracts words/phrases that:
    - Are between min_length and max_length characters
    - Don't contain special characters (except hyphens and dots)
    
    Args:
        text (str): Text to extract keywords from
        min_length (int): Minimum keyword length (default: 3)
        max_length (int): Maximum keyword length (default: 30)
    
    Returns:
        List[str]: List of extracted keywords
    
    Example:
        >>> extract_keywords("Experience with Python, TensorFlow, and AWS cloud")
        ['Experience', 'with', 'Python', 'TensorFlow', 'and', 'AWS', 'cloud']
    """
    if not text:
        return []
    
    # Split by whitespace and common punctuation
    # Keep hyphens and dots (for terms like "React.js", "C++", etc.)
    words = re.findall(r'[\w\.\-]+', text)
    
    keywords = []
    for word in words:
        # Filter by length
        if min_length <= len(word) <= max_length:
            keywords.append(word)
    
    return keywords


def normalize_skill(skill: str) -> str:
    """
    Normalize a skill name for comparison.
    
    Different resumes might write the same skill differently:
    - "JavaScript" vs "javascript" vs "JAVASCRIPT"
    - "React.js" vs "ReactJS" vs "React"
    
    This function normalizes skills to a standard format for comparison.
    
    Args:
        skill (str): Raw skill name
    
    Returns:
        str: Normalized skill name (lowercase, trimmed)
    
    Example:
        >>> normalize_skill("  JavaScript  ")
        'javascript'
        >>> normalize_skill("React.JS")
        'react.js'
    """
    if not skill:
        return ""
    
    # Convert to lowercase and remove extra whitespace
    normalized = skill.lower().strip()
    
    # Remove multiple spaces
    normalized = re.sub(r'\s+', ' ', normalized)
    
    return normalized


def deduplicate_skills(skills: List[str]) -> List[str]:
    """
    Remove duplicate skills from a list (case-insensitive).
    
    Args:
        skills (List[str]): List of skills (may contain duplicates)
    
    Returns:
        List[str]: List of unique skills (preserves original casing of first occurrence)
    
    Example:
        >>> deduplicate_skills(["Python", "Java", "python", "JavaScript"])
        ['Python', 'Java', 'JavaScript']
    """
    seen = set()
    unique_skills = []
    
    for skill in skills:
        normalized = normalize_skill(skill)
        if normalized and normalized not in seen:
            seen.add(normalized)
            unique_skills.append(skill)  # Keep original casing
    
    return unique_skills
