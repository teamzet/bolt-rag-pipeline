import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Copy, Download, CheckCircle, Play, Square, AlertCircle } from 'lucide-react';
import axios from 'axios';

// API endpoint configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface TestCaseResult {
  test_case: string;
  accuracy_percentage: number;
  sources_used: number;
}

interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  return_code: number;
  execution_time: string;
}
const TestCaseGenerator: React.FC = () => {
  const [description, setDescription] = useState('');
  const [generatedTestCase, setGeneratedTestCase] = useState<TestCaseResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);

  const handleGenerateTestCase = async () => {
    if (!description.trim() || isGenerating) return;

    setIsGenerating(true);
    setExecutionResult(null);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/generate-test-case`, {
        message: description.trim()
      });

      setGeneratedTestCase(response.data);
    } catch (error) {
      setGeneratedTestCase({
        test_case: 'Error generating test case. Please make sure the backend server is running.',
        accuracy_percentage: 0,
        sources_used: 0
      });
      console.error('Error generating test case:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (generatedTestCase?.test_case) {
      await navigator.clipboard.writeText(generatedTestCase.test_case);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (generatedTestCase?.test_case) {
      const blob = new Blob([generatedTestCase.test_case], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'generated-test-case.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleExecuteTest = async () => {
    if (!generatedTestCase?.test_case || isExecuting) return;
    
    // Check if it's a Python script
    const isPythonScript = generatedTestCase.test_case.includes('import ') || 
                          generatedTestCase.test_case.includes('def ') ||
                          generatedTestCase.test_case.includes('class ');
    
    if (!isPythonScript) {
      alert('Test execution is only available for Python scripts.');
      return;
    }

    setIsExecuting(true);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/execute-test`, {
        script_content: generatedTestCase.test_case,
        test_name: 'generated_test'
      });

      setExecutionResult(response.data);
    } catch (error) {
      setExecutionResult({
        success: false,
        stdout: '',
        stderr: 'Failed to execute test. Please check the backend server.',
        return_code: -1,
        execution_time: 'N/A'
      });
      console.error('Error executing test:', error);
    } finally {
      setIsExecuting(false);
    }
  };
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <h2 className="text-2xl font-bold text-white mb-2">Test Case Generator</h2>
        <p className="text-white/60">Generate detailed test cases based on your documentation</p>
      </div>

      {/* Input Section */}
      <div className="p-6 border-b border-white/10">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Describe the functionality you want to test
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Login functionality with username and password validation, or Salesforce lead creation process..."
              className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
          </div>
          
          <button
            onClick={handleGenerateTestCase}
            disabled={!description.trim() || isGenerating}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <Zap className="w-4 h-4" />
            {isGenerating ? 'Generating...' : 'Generate Test Case'}
          </button>
        </div>
      </div>

      {/* Results Section */}
      <div className="flex-1 p-6 overflow-hidden">
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center py-8"
          >
            <div className="flex items-center gap-3 text-white/60">
              <div className="w-6 h-6 border-2 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
              <span>Analyzing documentation and generating test case...</span>
            </div>
          </motion.div>
        )}

        {generatedTestCase && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 h-full flex flex-col"
          >
            <div className="flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-semibold text-white">Generated Test Case</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleExecuteTest}
                  disabled={isExecuting}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 border border-green-500 rounded-lg text-white text-sm transition-all duration-200 disabled:opacity-50"
                >
                  {isExecuting ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isExecuting ? 'Running...' : 'Run Test'}
                </button>
                <button
                  onClick={handleCopyToClipboard}
                  className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm transition-all duration-200"
                >
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm transition-all duration-200"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>

            {/* Accuracy and Stats */}
            <div className="flex items-center gap-4 text-sm text-white/70 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span>Accuracy:</span>
                <div className="w-20 bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, generatedTestCase.accuracy_percentage || 0))}%` }}
                  ></div>
                </div>
                <span>{generatedTestCase.accuracy_percentage?.toFixed(1) || '0.0'}%</span>
              </div>
              <div>Sources Used: {generatedTestCase.sources_used}</div>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-xl p-6 flex-1 overflow-hidden">
              <pre className="text-white whitespace-pre-wrap font-mono text-sm leading-relaxed h-full overflow-y-auto">
                {generatedTestCase.test_case}
              </pre>
            </div>

            {/* Execution Results */}
            {executionResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 border border-white/20 rounded-xl p-4 flex-shrink-0"
              >
                <div className="flex items-center gap-2 mb-3">
                  {executionResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  )}
                  <h4 className="font-semibold text-white">
                    Execution {executionResult.success ? 'Successful' : 'Failed'}
                  </h4>
                  <span className="text-sm text-white/60">({executionResult.execution_time})</span>
                </div>
                
                {executionResult.stdout && (
                  <div className="mb-2">
                    <p className="text-sm font-medium text-green-300 mb-1">Output:</p>
                    <pre className="text-sm text-white/80 bg-black/20 p-2 rounded max-h-32 overflow-y-auto">
                      {executionResult.stdout}
                    </pre>
                  </div>
                )}
                
                {executionResult.stderr && (
                  <div>
                    <p className="text-sm font-medium text-red-300 mb-1">Errors:</p>
                    <pre className="text-sm text-red-200 bg-red-900/20 p-2 rounded max-h-32 overflow-y-auto">
                      {executionResult.stderr}
                    </pre>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {!generatedTestCase && !isGenerating && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-2xl mb-4">
              <Zap className="w-12 h-12 text-blue-300" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Ready to Generate</h3>
            <p className="text-white/60 max-w-md">
              Describe the functionality you want to test, and I'll generate comprehensive test cases with accuracy metrics based on your uploaded documentation and Python files.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestCaseGenerator;