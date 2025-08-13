from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import uvicorn
from rag_pipeline import RAGPipeline
from config import Config

app = FastAPI(title="Local AI RAG API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "https://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize RAG pipeline
config = Config()
rag_pipeline = RAGPipeline(config)

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    sources: List[str] = []
    context_used: bool = False
    accuracy_percentage: float = 0.0

class DocumentInfo(BaseModel):
    filename: str
    size: int
    type: str
    processed: bool = False
    is_python: bool = False

class TestCaseResponse(BaseModel):
    test_case: str
    accuracy_percentage: float = 0.0
    sources_used: int = 0

class ExecutionRequest(BaseModel):
    script_content: str
    test_name: str

class ExecutionResponse(BaseModel):
    success: bool
    stdout: str
    stderr: str
    return_code: int
    execution_time: str
@app.on_startup
async def startup_event():
    """Initialize the RAG pipeline on startup"""
    await rag_pipeline.initialize()

@app.get("/")
async def root():
    return {"message": "Local AI RAG API is running"}

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Process chat request with RAG context"""
    try:
        response = await rag_pipeline.process_query(
            query=request.message,
            context=request.context
        )
        return ChatResponse(
            response=response["answer"],
            sources=response.get("sources", []),
            context_used=response.get("context_used", False),
            accuracy_percentage=response.get("accuracy_percentage", 0.0)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-document")
async def upload_document(file: UploadFile = File(...)):
    """Upload and process document for RAG"""
    try:
        # Save uploaded file
        file_path = os.path.join(config.documents_path, file.filename)
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Process document
        success = await rag_pipeline.add_document(file_path)
        
        if success:
            return {
                "message": f"Document {file.filename} uploaded and processed successfully",
                "filename": file.filename,
                "processed": True
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to process document")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents", response_model=List[DocumentInfo])
async def list_documents():
    """List all processed documents"""
    try:
        documents = await rag_pipeline.list_documents()
        return documents
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-test-case")
async def generate_test_case(request: ChatRequest) -> TestCaseResponse:
    """Generate test cases based on documentation"""
    try:
        result = await rag_pipeline.generate_test_case(request.message)
        return TestCaseResponse(
            test_case=result["test_case"],
            accuracy_percentage=result["accuracy_percentage"],
            sources_used=result["sources_used"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/execute-test", response_model=ExecutionResponse)
async def execute_test(request: ExecutionRequest):
    """Execute generated Python test script"""
    try:
        result = await rag_pipeline.execute_test_script(
            request.script_content,
            request.test_name
        )
        return ExecutionResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@app.delete("/documents/{filename}")
async def delete_document(filename: str):
    """Delete a document from the system"""
    try:
        success = await rag_pipeline.delete_document(filename)
        if success:
            return {"message": f"Document {filename} deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Document not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)