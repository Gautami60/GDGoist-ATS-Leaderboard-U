"""
Resume Parser Service

This module handles the extraction of text from resume files (PDF, DOCX).
It is responsible for reading binary file data and converting it to plain text.

Key Responsibilities:
- Read PDF files and extract text
- Read DOCX files and extract text
- Handle parsing errors gracefully
- Return both extracted text and any errors encountered
"""

import io
from typing import Tuple, List, Optional
import re

from pdfminer.high_level import extract_text as extract_text_from_pdf
import docx


def extract_text_from_docx_bytes(data: bytes) -> str:
    """
    Extract text from a DOCX file provided as bytes.
    
    DOCX files are actually ZIP archives containing XML files. The python-docx
    library handles this complexity and extracts the text content.
    
    Args:
        data (bytes): Raw bytes of a DOCX file
    
    Returns:
        str: Extracted text from all paragraphs in the document
    
    Raises:
        Exception: If the file cannot be parsed as a valid DOCX
    """
    try:
        # Create a Document object from bytes
        doc = docx.Document(io.BytesIO(data))
        
        # Extract text from all paragraphs
        full_text = []
        for para in doc.paragraphs:
            full_text.append(para.text)
        
        # Join paragraphs with newlines
        return '\n'.join(full_text)
    
    except Exception:
        raise


def safe_extract_text(file_bytes: bytes, filename: str) -> Tuple[str, List[str]]:
    """
    Safely extract text from a resume file (PDF or DOCX).
    
    This is the main entry point for resume parsing. It:
    1. Determines file type from filename extension
    2. Calls the appropriate parser (PDF or DOCX)
    3. Catches and reports any parsing errors
    4. Always returns text (even if empty) and a list of errors
    
    Args:
        file_bytes (bytes): Raw bytes of the uploaded file
        filename (str): Original filename (used to determine file type)
    
    Returns:
        Tuple[str, List[str]]: (extracted_text, list_of_errors)
            - extracted_text: Plain text content (empty string if parsing failed)
            - list_of_errors: List of error messages (empty if no errors)
    
    Example:
        >>> text, errors = safe_extract_text(pdf_bytes, "resume.pdf")
        >>> if errors:
        ...     print(f"Parsing had issues: {errors}")
        >>> print(f"Extracted {len(text)} characters")
    """
    errors = []
    text = ''
    
    # Get lowercase filename for case-insensitive extension checking
    lower = filename.lower()
    
    try:
        # Handle PDF files
        if lower.endswith('.pdf'):
            try:
                # pdfminer expects a file-like object, so wrap bytes in BytesIO
                text = extract_text_from_pdf(io.BytesIO(file_bytes))
            except Exception as e:
                errors.append(f'PDF parsing error: {str(e)}')
        
        # Handle DOCX/DOC files
        elif lower.endswith('.docx') or lower.endswith('.doc'):
            try:
                text = extract_text_from_docx_bytes(file_bytes)
            except Exception as e:
                errors.append(f'DOCX parsing error: {str(e)}')
        
        # Unsupported file type
        else:
            errors.append('Unsupported file extension')
    
    except Exception as e:
        errors.append(f'Unexpected parsing error: {str(e)}')
    
    # Ensure text is never None
    text = text or ''
    
    return text, errors


def find_section(text: str, section_names: List[str]) -> Optional[str]:
    """
    Find and extract a specific section from resume text.
    
    Resumes typically have sections like "Education", "Experience", "Skills", etc.
    This function uses a simple heuristic to find these sections:
    1. Look for lines that start with one of the section names
    2. Extract content until the next section header or blank line
    
    Args:
        text (str): Full resume text
        section_names (List[str]): Possible names for the section (e.g., ['skills', 'technical skills'])
    
    Returns:
        Optional[str]: Extracted section content, or None if section not found
    
    Example:
        >>> resume = "EDUCATION\\nBS Computer Science\\n\\nEXPERIENCE\\nSoftware Engineer"
        >>> find_section(resume, ['education'])
        'BS Computer Science'
    """
    lines = text.splitlines()
    idx = None
    
    # Find the line where the section starts
    for i, ln in enumerate(lines):
        l = ln.strip().lower()
        for name in section_names:
            if l.startswith(name):
                idx = i
                break
        if idx is not None:
            break
    
    # Section not found
    if idx is None:
        return None
    
    # Collect lines after the section header
    collected = []
    for ln in lines[idx + 1:]:
        # Stop at blank lines (if we already have content)
        if not ln.strip():
            if collected:
                break
            else:
                continue
        
        # Stop at next section header (heuristic: all caps or ends with ':')
        if re.match(r'^[A-Z\s]{3,}$', ln.strip()) or ln.strip().endswith(':'):
            break
        
        collected.append(ln.strip())
    
    return '\n'.join(collected).strip() if collected else None


def extract_contact_info(text: str) -> dict:
    """
    Extract contact information (email and phone) from resume text.
    
    Uses regular expressions to find:
    - Email addresses (pattern: word@word.word)
    - Phone numbers (various formats with optional country code)
    
    Args:
        text (str): Resume text to search
    
    Returns:
        dict: Dictionary with 'email' and 'phone' keys (values are None if not found)
    
    Example:
        >>> extract_contact_info("Contact: john@example.com, +1-555-1234")
        {'email': 'john@example.com', 'phone': '+1-555-1234'}
    """
    # Email pattern: basic email format
    email_re = re.compile(r'[\w\.-]+@[\w\.-]+')
    
    # Phone pattern: flexible phone number format
    # Matches: +1-555-1234, (555) 123-4567, 555.123.4567, etc.
    phone_re = re.compile(r'(\+?\d[\d\s\-()]{6,}\d)')
    
    # Search for patterns
    email = email_re.search(text)
    phone = phone_re.search(text)
    
    return {
        'email': email.group(0) if email else None,
        'phone': phone.group(0) if phone else None
    }
