import os
from pathlib import Path

class Config:
    def __init__(self):
        # Base paths
        self.base_path = Path(__file__).parent.parent
        self.documents_path = self.base_path / "backend" / "documents"
        self.chroma_db_path = self.base_path / "chroma_db"
        
        # Create directories if they don't exist
        self.documents_path.mkdir(parents=True, exist_ok=True)
        self.chroma_db_path.mkdir(parents=True, exist_ok=True)
        
        # LiteLLM configuration
        self.litellm_endpoint = os.getenv("LITELLM_ENDPOINT", "http://localhost:4000")
        
        # Model configuration
        self.embedding_model = "sentence-transformers/all-MiniLM-L6-v2"
        self.llm_model = "gpt-3.5-turbo"
        
        # ChromaDB settings
        self.collection_name = "documents"
        self.max_documents = 1000
        
        # Text processing settings
        self.chunk_size = 1000
        self.chunk_overlap = 200
        self.max_context_length = 4000