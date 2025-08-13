import os
import asyncio
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings
import requests
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.document_loaders import PyPDFLoader, TextLoader, UnstructuredWordDocumentLoader
from langchain.embeddings import HuggingFaceEmbeddings
import json
from pathlib import Path
import ast
import subprocess
import tempfile
from difflib import SequenceMatcher

class RAGPipeline:
    def __init__(self, config):
        self.config = config
        self.client = None
        self.collection = None
        self.embeddings = None
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        self.python_files = {}  # Store Python file contents for analysis
        
    async def initialize(self):
        """Initialize ChromaDB and embeddings"""
        try:
            # Initialize ChromaDB
            self.client = chromadb.PersistentClient(
                path=self.config.chroma_db_path,
                settings=Settings(anonymized_telemetry=False)
            )
            
            # Get or create collection
            self.collection = self.client.get_or_create_collection(
                name="documents",
                metadata={"hnsw:space": "cosine"}
            )
            
            # Initialize embeddings
            self.embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2"
            )
            
            print("RAG Pipeline initialized successfully")
            
        except Exception as e:
            print(f"Error initializing RAG pipeline: {e}")
            raise
    
    async def add_document(self, file_path: str) -> bool:
        """Process and add document to vector store"""
        try:
            print(f"Processing document: {file_path}")
            
            # Load document based on file type
            loader = self._get_document_loader(file_path)
            documents = loader.load()
            
            # Special handling for Python files
            if file_path.endswith('.py'):
                await self._process_python_file(file_path, documents)
            print(f"Loaded {len(documents)} document sections")
            
            # Split documents into chunks
            chunks = self.text_splitter.split_documents(documents)
            
            print(f"Split into {len(chunks)} chunks")
            
            # Create embeddings and add to ChromaDB
            for i, chunk in enumerate(chunks):
                embedding = self.embeddings.embed_query(chunk.page_content)
                
                self.collection.add(
                    embeddings=[embedding],
                    documents=[chunk.page_content],
                    metadatas=[{
                        "source": os.path.basename(file_path),
                        "chunk_id": i,
                        "file_path": file_path,
                        "file_type": "python" if file_path.endswith('.py') else "document"
                    }],
                    ids=[f"{os.path.basename(file_path)}_{i}"]
                )
            
            print(f"Successfully processed and indexed {os.path.basename(file_path)}")
            return True
            
        except Exception as e:
            print(f"Error processing document {file_path}: {e}")
            return False
    
    async def _process_python_file(self, file_path: str, documents):
        """Extract Python code structure and comments"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Parse Python AST to extract structure
            tree = ast.parse(content)
            
            # Extract classes, functions, and their docstrings
            code_structure = {
                'classes': [],
                'functions': [],
                'imports': [],
                'comments': self._extract_comments(content)
            }
            
            for node in ast.walk(tree):
                if isinstance(node, ast.ClassDef):
                    code_structure['classes'].append({
                        'name': node.name,
                        'docstring': ast.get_docstring(node),
                        'methods': [n.name for n in node.body if isinstance(n, ast.FunctionDef)]
                    })
                elif isinstance(node, ast.FunctionDef):
                    code_structure['functions'].append({
                        'name': node.name,
                        'docstring': ast.get_docstring(node),
                        'args': [arg.arg for arg in node.args.args]
                    })
                elif isinstance(node, ast.Import):
                    code_structure['imports'].extend([alias.name for alias in node.names])
                elif isinstance(node, ast.ImportFrom):
                    module = node.module or ''
                    code_structure['imports'].extend([f"{module}.{alias.name}" for alias in node.names])
            
            self.python_files[os.path.basename(file_path)] = {
                'content': content,
                'structure': code_structure,
                'path': file_path
            }
            
        except Exception as e:
            print(f"Error processing Python file structure: {e}")

    def _extract_comments(self, content: str) -> List[str]:
        """Extract comments from Python code"""
        comments = []
        lines = content.split('\n')
        for line in lines:
            stripped = line.strip()
            if stripped.startswith('#'):
                comments.append(stripped)
        return comments
    def _get_document_loader(self, file_path: str):
        """Get appropriate document loader based on file extension"""
        file_extension = Path(file_path).suffix.lower()
        
        if file_extension == '.pdf':
            return PyPDFLoader(file_path)
        elif file_extension in ['.txt', '.md', '.py']:
            return TextLoader(file_path)
        elif file_extension in ['.docx', '.doc']:
            return UnstructuredWordDocumentLoader(file_path)
        else:
            # Default to text loader
            return TextLoader(file_path)
    
    async def process_query(self, query: str, context: Optional[str] = None) -> Dict[str, Any]:
        """Process query using RAG"""
        try:
            # Create query embedding
            query_embedding = self.embeddings.embed_query(query)
            
            # Search similar documents
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=5
            )
            
            # Extract relevant context
            retrieved_docs = results['documents'][0] if results['documents'] else []
            sources = []
            accuracy_score = 0.0
            
            if results['metadatas']:
                sources = [meta.get('source', 'Unknown') for meta in results['metadatas'][0]]
                # Calculate accuracy based on similarity scores
                if results.get('distances') and results['distances'][0]:
                    # Convert distances to similarity scores (lower distance = higher similarity)
                    similarities = [1 - dist for dist in results['distances'][0]]
                    accuracy_score = max(similarities) * 100 if similarities else 0.0
            
            # Build context for LLM
            context_text = "\n\n".join(retrieved_docs[:3])  # Use top 3 results
            
            # Generate response using LiteLLM
            response = await self._generate_response(query, context_text)
            
            return {
                "answer": response,
                "sources": list(set(sources)),
                "context_used": len(retrieved_docs) > 0,
                "accuracy_percentage": round(accuracy_score, 1)
            }
            
        except Exception as e:
            print(f"Error processing query: {e}")
            return {
                "answer": "I apologize, but I encountered an error processing your request.",
                "sources": [],
                "context_used": False,
                "accuracy_percentage": 0.0
            }
    
    async def _generate_response(self, query: str, context: str) -> str:
        """Generate response using LiteLLM proxy"""
        try:
            prompt = f"""
            Based on the following context, please answer the question. If the context doesn't contain relevant information, say so clearly.
            
            Context:
            {context}
            
            Question: {query}
            
            Answer:
            """
            
            # Call LiteLLM proxy
            response = requests.post(
                f"{self.config.litellm_endpoint}/chat/completions",
                json={
                    "model": "gpt-3.5-turbo",
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 500,
                    "temperature": 0.7
                },
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                return result['choices'][0]['message']['content']
            else:
                return "I'm having trouble accessing the AI model right now. Please try again later."
                
        except Exception as e:
            print(f"Error generating response: {e}")
            return "I encountered an error while generating a response."
    
    async def generate_test_case(self, description: str) -> str:
        """Generate test cases based on description"""
        try:
            # Search for relevant documentation
            query_embedding = self.embeddings.embed_query(description)
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=3
            )
            
            context = "\n\n".join(results['documents'][0]) if results['documents'] else ""
            
            # Find relevant Python files
            python_context = ""
            if results.get('metadatas'):
                for metadata in results['metadatas'][0]:
                    if metadata.get('file_type') == 'python':
                        source = metadata.get('source')
                        if source in self.python_files:
                            python_info = self.python_files[source]
                            python_context += f"\n\nPython file structure from {source}:\n"
                            python_context += f"Classes: {[c['name'] for c in python_info['structure']['classes']]}\n"
                            python_context += f"Functions: {[f['name'] for f in python_info['structure']['functions']]}\n"
                            python_context += f"Key imports: {python_info['structure']['imports'][:5]}\n"
                            python_context += f"Comments: {python_info['structure']['comments'][:3]}\n"
            
            # Calculate accuracy
            accuracy_score = 0.0
            if results.get('distances') and results['distances'][0]:
                similarities = [1 - dist for dist in results['distances'][0]]
                accuracy_score = max(similarities) * 100 if similarities else 0.0
            
            prompt = f"""
            Based on the following documentation context and Python code examples, generate detailed test cases for: {description}
            
            Documentation Context:
            {context}
            
            Python Code Context:
            {python_context}
            
            IMPORTANT REQUIREMENTS:
            1. If generating Python code, include detailed inline comments explaining each step
            2. Preserve the coding style and patterns from the provided examples
            3. Include proper error handling and assertions
            4. Add docstrings for functions and classes
            5. Use meaningful variable names
            
            Please provide:
            1. Test case title
            2. Prerequisites
            3. Test steps
            4. Expected results
            5. Edge cases to consider
            6. If Python code: Include complete, well-commented script
            
            Test Case:
            """
            
            response = requests.post(
                f"{self.config.litellm_endpoint}/chat/completions",
                json={
                    "model": "gpt-3.5-turbo",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 1500,
                    "temperature": 0.5
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "test_case": result['choices'][0]['message']['content'],
                    "accuracy_percentage": round(accuracy_score, 1),
                    "sources_used": len(results['documents'][0]) if results['documents'] else 0
                }
            else:
                return {
                    "test_case": "Unable to generate test case at this time.",
                    "accuracy_percentage": 0.0,
                    "sources_used": 0
                }
                
        except Exception as e:
            print(f"Error generating test case: {e}")
            return {
                "test_case": "Error occurred while generating test case.",
                "accuracy_percentage": 0.0,
                "sources_used": 0
            }

    async def execute_test_script(self, script_content: str, test_name: str) -> Dict[str, Any]:
        """Execute generated Python test script"""
        try:
            # Create temporary file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as temp_file:
                temp_file.write(script_content)
                temp_file_path = temp_file.name
            
            # Execute the script
            result = subprocess.run(
                ['python', temp_file_path],
                capture_output=True,
                text=True,
                timeout=30  # 30 second timeout
            )
            
            # Clean up
            os.unlink(temp_file_path)
            
            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "return_code": result.returncode,
                "execution_time": "< 30s"
            }
            
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "stdout": "",
                "stderr": "Test execution timed out after 30 seconds",
                "return_code": -1,
                "execution_time": "30s (timeout)"
            }
        except Exception as e:
            return {
                "success": False,
                "stdout": "",
                "stderr": f"Execution error: {str(e)}",
                "return_code": -1,
                "execution_time": "N/A"
            }
    
    async def list_documents(self) -> List[Dict[str, Any]]:
        """List all processed documents"""
        try:
            # Get all unique sources from collection
            all_data = self.collection.get()
            sources = set()
            
            if all_data['metadatas']:
                for metadata in all_data['metadatas']:
                    if 'source' in metadata:
                        sources.add(metadata['source'])
            
            documents = []
            documents_dir = Path(self.config.documents_path)
            
            for source in sources:
                file_path = documents_dir / source
                if file_path.exists():
                    stat = file_path.stat()
                    documents.append({
                        "filename": source,
                        "size": stat.st_size,
                        "type": file_path.suffix,
                        "processed": True,
                        "is_python": file_path.suffix == '.py'
                    })
            
            return documents
            
        except Exception as e:
            print(f"Error listing documents: {e}")
            return []
    
    async def delete_document(self, filename: str) -> bool:
        """Delete document from vector store and filesystem"""
        try:
            # Get all document IDs for this file
            all_data = self.collection.get()
            ids_to_delete = []
            
            if all_data['metadatas']:
                for i, metadata in enumerate(all_data['metadatas']):
                    if metadata.get('source') == filename:
                        ids_to_delete.append(all_data['ids'][i])
            
            # Delete from ChromaDB
            if ids_to_delete:
                self.collection.delete(ids=ids_to_delete)
            
            # Remove from Python files cache
            if filename in self.python_files:
                del self.python_files[filename]
            
            # Delete file from filesystem
            file_path = Path(self.config.documents_path) / filename
            if file_path.exists():
                file_path.unlink()
            
            return True
            
        except Exception as e:
            print(f"Error deleting document {filename}: {e}")
            return False