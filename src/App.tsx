import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import DocumentManager from './components/DocumentManager';
import TestCaseGenerator from './components/TestCaseGenerator';
import { MessageSquare, FileText, TestTube } from 'lucide-react';

type View = 'chat' | 'documents' | 'testcases';

function App() {
  const [currentView, setCurrentView] = useState<View>('chat');

  const views = [
    { id: 'chat', label: 'AI Chat', icon: MessageSquare, component: ChatWindow },
    { id: 'documents', label: 'Documents', icon: FileText, component: DocumentManager },
    { id: 'testcases', label: 'Test Cases', icon: TestTube, component: TestCaseGenerator },
  ];

  const CurrentComponent = views.find(view => view.id === currentView)?.component || ChatWindow;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="flex h-screen">
        <Sidebar 
          views={views}
          currentView={currentView}
          onViewChange={setCurrentView}
        />
        
        <main className="flex-1 flex flex-col overflow-hidden">
          <motion.div 
            className="flex-1 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="h-full bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl">
              <CurrentComponent />
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

export default App;