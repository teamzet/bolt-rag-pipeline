import React from 'react';
import { motion } from 'framer-motion';
import { Brain, DivideIcon as LucideIcon } from 'lucide-react';

interface View {
  id: string;
  label: string;
  icon: LucideIcon;
  component: React.ComponentType<any>;
}

interface SidebarProps {
  views: View[];
  currentView: string;
  onViewChange: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ views, currentView, onViewChange }) => {
  return (
    <motion.aside 
      className="w-64 bg-black/20 backdrop-blur-xl border-r border-white/10 p-6"
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Local AI</h1>
          <p className="text-sm text-white/60">RAG Assistant</p>
        </div>
      </div>

      <nav className="space-y-2">
        {views.map((view) => {
          const Icon = view.icon;
          const isActive = currentView === view.id;
          
          return (
            <motion.button
              key={view.id}
              onClick={() => onViewChange(view.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${isActive 
                  ? 'bg-white/20 text-white shadow-lg' 
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{view.label}</span>
            </motion.button>
          );
        })}
      </nav>

      <div className="mt-8 p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-white/10">
        <h3 className="text-sm font-semibold text-white mb-2">Status</h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-white/70">RAG Pipeline Active</span>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;