# ATS Service - Resume Parsing & Scoring Microservice

## What is this?

The **ATS Service** is a microservice that analyzes resumes and calculates how well they match job descriptions. ATS stands for "Applicant Tracking System" - software that companies use to automatically screen job applications.

## What does it do?

This service provides three main capabilities:

1. **Resume Parsing**: Extracts text from PDF and DOCX files
2. **Section Detection**: Identifies key sections (Education, Experience, Skills, Contact Info)
3. **ATS Scoring**: Calculates a score (0-100) based on:
   - Resume structure and completeness (50 points)
   - Relevance to job description (50 points)

## Why is it a separate microservice?

In the GDGoist ATS Leaderboard project, this service is separate from the main backend for several important reasons:

### 1. **Separation of Concerns**
- Main backend: User authentication, database, leaderboard logic
- ATS service: Resume processing, text analysis, scoring
- Each service has a single, clear responsibility

### 2. **Independent Scaling**
- Resume parsing is CPU-intensive (especially with large PDFs)
- Can scale ATS service independently based on upload volume
- Main backend might need different scaling (more instances for API requests)

### 3. **Technology Isolation**
- ATS service uses Python (best for ML/NLP libraries)
- Main backend uses Node.js/Express (best for web APIs)
- Each service uses the right tool for the job

### 4. **Fault Isolation**
- If ATS service crashes, main app continues to work
- Users can still browse leaderboard, view profiles, etc.
- Better overall system reliability

### 5. **Independent Development**
- Can update scoring algorithm without touching main backend
- Can add new file formats without backend changes
- Faster iteration and testing

## Architecture

```
ats-service/
│
├── main.py                    # Entry point - starts the FastAPI server
├── requirements.txt           # Python dependencies
│
├── app/
│   ├── __init__.py           # App initialization & configuration
│   │
│   ├── routes/               # HTTP Endpoints (API layer)
│   │   └── score.py          # /parse, /similarity, /health endpoints
│   │
│   ├── services/             # Business Logic (core functionality)
│   │   ├── parser.py         # Extract text from PDF/DOCX files
│   │   ├── extractor.py      # Extract skills and keywords
│   │   └── scorer.py         # Calculate ATS scores and similarity
│   │
│   ├── utils/                # Helper Functions
│   │   └── text_cleaner.py   # Text cleaning and normalization
│   │
│   └── models/               # Data Schemas
│       └── response_schema.py # API response structures
│
└── README.md                 # This file
```

## Request → Response Flow

Here's what happens when a user uploads a resume:

```
1. User uploads resume on frontend
   ↓
2. Frontend sends file to main backend (Node.js)
   ↓
3. Main backend forwards file to ATS service (this service)
   ↓
4. ATS Service processes the file:
   
   a. routes/score.py receives HTTP request
      ↓
   b. services/parser.py extracts text from PDF/DOCX
      ↓
   c. services/extractor.py identifies skills and sections
      ↓
   d. services/scorer.py calculates ATS score
      ↓
   e. models/response_schema.py formats the response
   
5. ATS service returns JSON response to main backend
   ↓
6. Main backend stores score in database
   ↓
7. Frontend displays score to user
```

## API Endpoints

### `POST /parse`
**Main endpoint**: Parse and score a resume

**Request:**
- `file`: Resume file (PDF or DOCX)
- `job_description` (optional): Job description text

**Response:**
```json
{
  "atsScore": 85.5,
  "parsedSkills": ["Python", "JavaScript", "React"],
  "feedback": [
    "Education section detected",
    "Excellent semantic match to job description"
  ],
  "contact": {
    "email": "john@example.com",
    "phone": "+1-555-1234"
  },
  "breakdown": {
    "education": 12,
    "experience": 18,
    "skills": 10,
    "contact": 10,
    "heuristics": 50,
    "relevance": 35.5
  }
}
```

### `POST /similarity`
Calculate similarity between resume and job description

### `POST /semantic-similarity`
Calculate similarity between any two texts

### `GET /health`
Check service status

## Scoring Algorithm

### Total Score: 0-100 points

#### Heuristic Score (0-50 points)
Based on resume structure:
- **Education section**: 12 points
- **Experience section**: 18 points
- **Skills section**: 10 points
- **Contact info**: 10 points
- **Formatting issues**: -10 points
- **Parsing errors**: -20 points

#### Relevance Score (0-50 points)
Based on job description match:
- Uses TF-IDF (Term Frequency-Inverse Document Frequency)
- Measures semantic similarity between resume and job description
- Converted to 0-50 scale

**Note**: If no job description is provided, heuristic score is doubled (0-100).

## Installation & Setup

### Prerequisites
- Python 3.8+
- pip

### Install Dependencies
```bash
pip install -r requirements.txt
```

### Run the Service
```bash
python main.py
```

The service will start on `http://localhost:8000`

### Test the Service
```bash
# Health check
curl http://localhost:8000/health

# Parse a resume
curl -X POST http://localhost:8000/parse \
  -F "file=@resume.pdf" \
  -F "job_description=Looking for Python developer with 3+ years experience"
```

## Technology Stack

- **FastAPI**: Modern Python web framework
- **pdfminer.six**: PDF text extraction
- **python-docx**: DOCX text extraction
- **scikit-learn**: TF-IDF similarity calculation
- **NLTK**: Natural language processing (stopwords)
- **Pydantic**: Data validation and schemas

## Code Organization Principles

### 1. **Separation of Concerns**
Each module has a single responsibility:
- Routes handle HTTP (no business logic)
- Services contain business logic (no HTTP)
- Utils provide helpers (no decisions)
- Models define data structure (no logic)

### 2. **Single Responsibility Principle**
Each file does one thing:
- `parser.py`: Only file parsing
- `extractor.py`: Only skill extraction
- `scorer.py`: Only scoring logic
- `text_cleaner.py`: Only text cleaning

### 3. **Dependency Direction**
```
Routes → Services → Utils
   ↓         ↓
Models ← ← ← ←
```
- Routes depend on Services and Models
- Services depend on Utils
- Utils have no dependencies
- Models are used everywhere

## Development Guidelines

### Adding a New Feature

1. **Identify the layer**:
   - New endpoint? → Add to `routes/`
   - New business logic? → Add to `services/`
   - New helper function? → Add to `utils/`
   - New response format? → Add to `models/`

2. **Follow the pattern**:
   - Routes: Accept request → Call service → Return response
   - Services: Pure functions with clear inputs/outputs
   - Utils: Stateless helper functions
   - Models: Pydantic schemas with validation

3. **Update imports**:
   - Add to `__init__.py` in the package
   - Import in the file that needs it

### Example: Adding PDF metadata extraction

```python
# 1. Add to services/parser.py
def extract_pdf_metadata(file_bytes: bytes) -> dict:
    """Extract metadata from PDF file"""
    # Implementation here
    pass

# 2. Export in services/__init__.py
from app.services.parser import extract_pdf_metadata

# 3. Use in routes/score.py
from app.services.parser import extract_pdf_metadata

@router.post('/parse')
async def parse_resume(...):
    metadata = extract_pdf_metadata(data)
    # Use metadata in response
```

## Troubleshooting

### Common Issues

**Issue**: `ModuleNotFoundError: No module named 'app'`
- **Solution**: Run from the `ats-service/` directory, not from inside `app/`

**Issue**: `PDF parsing error`
- **Solution**: Ensure PDF is not password-protected or corrupted

**Issue**: `DOCX parsing error`
- **Solution**: Ensure file is a valid .docx file (not .doc)

**Issue**: Port 8000 already in use
- **Solution**: Change port in `main.py` or kill the process using port 8000

## Future Enhancements

Potential improvements:
- [ ] Add support for more file formats (TXT, RTF)
- [ ] Enable SBERT for better semantic matching
- [ ] Add caching for repeated job descriptions
- [ ] Implement rate limiting
- [ ] Add resume quality suggestions
- [ ] Support multiple languages

## Contributing

When contributing, please:
1. Maintain the existing architecture
2. Add docstrings to all functions
3. Keep business logic out of routes
4. Update this README if adding new features

## License

Part of the GDGoist ATS Leaderboard project.
