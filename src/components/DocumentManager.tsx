import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Trash2, Download, CheckCircle, AlertCircle, FileCode } from 'lucide-react';
import axios from 'axios';

// API endpoint configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Document {
  filename: string;
  size: number;
  type: string;
  processed: boolean;
}

const DocumentManager: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'text/x-python': ['.py'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    onDrop: handleFileUpload,
    multiple: true
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/documents`);
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  async function handleFileUpload(acceptedFiles: File[]) {
    setIsUploading(true);
    setUploadStatus('');

    for (const file of acceptedFiles) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        await axios.post(`${API_BASE_URL}/upload-document`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        setUploadStatus(`✅ ${file.name} uploaded successfully`);
      } catch (error) {
        setUploadStatus(`❌ Failed to upload ${file.name}`);
        console.error('Upload error:', error);
      }
    }

    setIsUploading(false);
    fetchDocuments();
  }

  const handleDeleteDocument = async (filename: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/documents/${filename}`);
      setDocuments(documents.filter(doc => doc.filename !== filename));
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    return <FileText className="w-5 h-5" />;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <h2 className="text-2xl font-bold text-white mb-2">Document Manager</h2>
        <p className="text-white/60">Upload and manage your documents for RAG processing</p>
      </div>

      {/* Upload Area */}
      <div className="p-6">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
            ${isDragActive 
              ? 'border-blue-400 bg-blue-500/10' 
              : 'border-white/30 hover:border-white/50 hover:bg-white/5'
            }
          `}
        >
          <input {...getInputProps()} />
          <motion.div
            animate={{ scale: isDragActive ? 1.05 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <Upload className="w-12 h-12 text-white/60 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-white text-lg">Drop your documents here...</p>
            ) : (
              <div>
                <p className="text-white text-lg mb-2">
                  Drag & drop documents here, or click to select
                </p>
                <p className="text-white/60 text-sm">
                  Supports PDF, TXT, MD, PY, and DOCX files
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {isUploading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg"
          >
            <div className="flex items-center gap-2 text-blue-200">
              <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
              <span>Uploading and processing documents...</span>
            </div>
          </motion.div>
        )}

        {uploadStatus && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg"
          >
            <p className="text-green-200">{uploadStatus}</p>
          </motion.div>
        )}
      </div>

      {/* Documents List */}
      <div className="flex-1 p-6 pt-0">
        <h3 className="text-lg font-semibold text-white mb-4">Uploaded Documents</h3>
        
        <div className="space-y-3">
          <AnimatePresence>
            {documents.map((doc, index) => (
              <motion.div
                key={doc.filename}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${doc.is_python ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'}`}>
                      {getFileIcon(doc.type)}
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{doc.filename}</h4>
                      <p className="text-white/60 text-sm">
                        {formatFileSize(doc.size)} • {doc.type.toUpperCase()} {doc.is_python && '• Python Script'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {doc.processed ? (
                      <div className="flex items-center gap-1 text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Processed</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-yellow-400">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">Processing</span>
                      </div>
                    )}
                    
                    <button
                      onClick={() => handleDeleteDocument(doc.filename)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {documents.length === 0 && (
          <div className="text-center py-8">
            <FileText className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <p className="text-white/60">No documents uploaded yet</p>
            <p className="text-white/40 text-sm">Upload some documents to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentManager;