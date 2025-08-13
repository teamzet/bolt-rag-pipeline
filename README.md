# Local AI RAG Project

A comprehensive AI-powered Retrieval-Augmented Generation (RAG) system with a beautiful React frontend and FastAPI backend. This project enables you to upload documents, chat with an AI assistant that has context from your documents, and generate test cases based on your documentation.

## Features

- 🤖 **AI Chat Interface**: Interactive chat with AI assistant powered by your documents
- 📄 **Document Management**: Upload and process PDF, TXT, MD, and DOCX files
- 🧪 **Test Case Generation**: Automatically generate detailed test cases from documentation
- 🔍 **Semantic Search**: ChromaDB vector database for intelligent document retrieval
- 🎨 **Beautiful UI**: Modern React interface with smooth animations
- 🔌 **Multiple AI Models**: Support for OpenAI, Anthropic, and local models via LiteLLM

## Architecture

```
local_ai_project/
├── backend/                 # FastAPI backend
│   ├── main.py             # Main API server
│   ├── rag_pipeline.py     # RAG processing logic
│   ├── config.py           # Configuration management
│   └── documents/          # Document storage
├── src/                    # React frontend
│   ├── components/         # UI components
│   └── App.tsx            # Main application
├── chroma_db/             # Vector database storage
└── requirements.txt       # Python dependencies
```

## Setup Instructions

### Prerequisites

- Python 3.8+
- Node.js 16+
- OpenAI API key (or other LLM provider)

### Backend Setup

1. **Create Python virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure LiteLLM:**
   - Edit `litellm_config.yaml` and replace `"your-openai-api-key-here"` with your actual OpenAI API key
   - Or configure other models as needed

4. **Start LiteLLM proxy:**
   ```bash
   litellm --config litellm_config.yaml --port 4000
   ```

5. **Start FastAPI backend:**
   ```bash
   cd backend
   python main.py
   ```

### Frontend Setup

The React frontend is already configured in this environment. The development server should be running automatically.

### Environment Configuration

For local development, create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:8000
```

For production deployment, set `VITE_API_URL` to your backend server URL.

## Usage

### Adding Your Existing Test Cases to RAG

To train the RAG system with your existing test cases, follow these steps:

1. **Organize Your Test Cases:**
   Place your test case files in the appropriate directories under `backend/documents/`:
   ```
   backend/documents/
   ├── test_cases/
   │   ├── web/                    # Web application test cases
   │   │   ├── login_test.py
   │   │   └── checkout_flow.feature
   │   ├── salesforce/             # Salesforce test cases
   │   │   └── create_lead_manual_steps.txt
   │   ├── sap/                    # SAP test cases
   │   │   └── po_creation_script.py
   │   └── general/                # General testing patterns
   │       └── common_test_patterns.md
   ├── salesforce_faq.md           # Domain knowledge
   ├── sap_processes.md            # Process documentation
   ├── web_qa_guide.txt           # Testing guidelines
   └── aem_component_dev.md        # Development guides
   ```

2. **Upload Documents via UI:**
   - Start the application (frontend is already running)
   - Navigate to the "Documents" tab
   - Drag and drop your test case files or click to upload
   - The system will automatically process and index them

3. **Supported File Types:**
   - **Python files (.py)**: Test scripts and automation code
   - **Feature files (.feature)**: Gherkin/BDD test scenarios
   - **Text files (.txt)**: Manual test cases and procedures
   - **Markdown files (.md)**: Documentation and test patterns
   - **PDF files (.pdf)**: Test plans and documentation
   - **Word documents (.docx)**: Test cases and specifications

4. **Training Process:**
   - Documents are automatically split into chunks for better retrieval
   - Each chunk is embedded using sentence transformers
   - Embeddings are stored in ChromaDB for semantic search
   - The AI can now reference your test cases when generating new ones

### 1. Upload Documents
- Navigate to the "Documents" tab
- Drag and drop or click to upload PDF, TXT, MD, or DOCX files
- Documents are automatically processed and indexed

### 2. Chat with AI
- Go to the "AI Chat" tab
- Ask questions about your uploaded documents
- The AI will provide answers with source references

### 3. Generate Test Cases
- Use the "Test Cases" tab
- Describe the functionality you want to test
- Get comprehensive test cases generated from your documentation

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
LITELLM_ENDPOINT=http://localhost:4000
OPENAI_API_KEY=your-api-key-here
```

### Document Types Supported

- **PDF**: Technical documentation, manuals
- **TXT**: Plain text files, logs
- **Markdown**: README files, technical specs
- **DOCX**: Word documents, reports

## API Endpoints

- `POST /chat` - Send chat messages
- `POST /upload-document` - Upload new documents
- `GET /documents` - List all documents
- `DELETE /documents/{filename}` - Delete a document
- `POST /generate-test-case` - Generate test cases

## Example Documents

The project includes sample documents in `backend/documents/`:
- Salesforce FAQ
- Test case examples
- Process documentation

## Troubleshooting

### Common Issues

1. **Backend not responding:**
   - Ensure FastAPI server is running on port 8000
   - Check if LiteLLM proxy is running on port 4000

2. **Document upload fails:**
   - Verify document format is supported
   - Check file permissions in documents directory

3. **AI responses are generic:**
   - Upload relevant documents first
   - Wait for documents to be fully processed

### Development

To extend the project:

1. **Add new document types:**
   - Modify `_get_document_loader()` in `rag_pipeline.py`
   - Update file type validation in frontend

2. **Integrate new AI models:**
   - Add model configuration to `litellm_config.yaml`
   - Update model selection in frontend

3. **Customize UI:**
   - Modify React components in `src/components/`
   - Update styling with Tailwind CSS classes

## License

MIT License - feel free to use this project for your own applications.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

For questions or support, please open an issue in the repository.