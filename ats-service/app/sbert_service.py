#!/usr/bin/env python3
"""
Standalone SBERT Semantic Analysis Service
Uses sentence-transformers for semantic similarity
"""

from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import sys

app = FastAPI(title="SBERT Semantic Analysis Service")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Try to load SBERT model
try:
    from sentence_transformers import SentenceTransformer, util
    import torch
    
    print("Loading SBERT model (all-MiniLM-L6-v2)...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    SBERT_ENABLED = True
    print("✓ SBERT model loaded successfully")
except Exception as e:
    print(f"✗ Failed to load SBERT: {e}")
    SBERT_ENABLED = False
    model = None


@app.get('/health')
def health():
    return {
        'status': 'ok',
        'sbert_enabled': SBERT_ENABLED,
        'model': 'all-MiniLM-L6-v2' if SBERT_ENABLED else 'unavailable'
    }


@app.post('/semantic-similarity')
async def semantic_similarity(text1: str = Form(...), text2: str = Form(...)):
    """Calculate semantic similarity between two texts"""
    try:
        if not text1 or not text2:
            return {'error': 'Both text1 and text2 are required', 'similarity': 0.0}
        
        if not SBERT_ENABLED or model is None:
            return {'error': 'SBERT not available', 'similarity': 0.0}
        
        # Encode texts
        embeddings1 = model.encode(text1, convert_to_tensor=True)
        embeddings2 = model.encode(text2, convert_to_tensor=True)
        
        # Calculate cosine similarity
        similarity = util.pytorch_cos_sim(embeddings1, embeddings2).item()
        
        # Ensure similarity is between 0 and 1
        similarity = max(0.0, min(1.0, float(similarity)))
        
        return {
            'similarity': similarity,
            'method': 'SBERT',
            'model': 'all-MiniLM-L6-v2'
        }
    
    except Exception as e:
        print(f"Error: {e}")
        return {'error': str(e), 'similarity': 0.0}


@app.post('/batch-similarity')
async def batch_similarity(text1: str = Form(...), texts2: str = Form(...)):
    """Calculate similarity between one text and multiple texts"""
    try:
        if not text1 or not texts2:
            return {'error': 'text1 and texts2 are required', 'similarities': []}
        
        if not SBERT_ENABLED or model is None:
            return {'error': 'SBERT not available', 'similarities': []}
        
        # Parse texts2 as JSON array
        try:
            texts2_list = json.loads(texts2) if isinstance(texts2, str) else texts2
        except:
            texts2_list = [texts2]
        
        # Encode texts
        embedding1 = model.encode(text1, convert_to_tensor=True)
        embeddings2 = model.encode(texts2_list, convert_to_tensor=True)
        
        # Calculate cosine similarities
        similarities = util.pytorch_cos_sim(embedding1, embeddings2)[0].cpu().tolist()
        
        # Ensure all similarities are between 0 and 1
        similarities = [max(0.0, min(1.0, float(s))) for s in similarities]
        
        return {
            'similarities': similarities,
            'method': 'SBERT',
            'model': 'all-MiniLM-L6-v2'
        }
    
    except Exception as e:
        print(f"Error: {e}")
        return {'error': str(e), 'similarities': []}


if __name__ == '__main__':
    import uvicorn
    port = 8001
    print(f"\n{'='*50}")
    print(f"SBERT Semantic Analysis Service")
    print(f"{'='*50}")
    print(f"Status: {'✓ Ready' if SBERT_ENABLED else '✗ SBERT unavailable'}")
    print(f"Listening on: http://localhost:{port}")
    print(f"{'='*50}\n")
    
    uvicorn.run(app, host='0.0.0.0', port=port)
