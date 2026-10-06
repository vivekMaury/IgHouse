import React from 'react';
import { MessageSquare, Zap, Clock, GitBranch, Sparkles } from 'lucide-react';

export default function FlowSidebar() {
  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/reactflow-label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-64 border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 h-full overflow-y-auto">
      <h3 className="font-semibold text-lg mb-4 text-slate-800 dark:text-slate-200">Nodes Palette</h3>
      
      <div className="flex flex-col gap-3">
        <div 
          className="flex items-center gap-3 p-3 border rounded-md bg-white dark:bg-slate-900 cursor-grab hover:border-blue-500 transition-colors border-slate-200 dark:border-slate-800 shadow-sm"
          onDragStart={(e) => onDragStart(e, 'trigger', 'New Trigger')} 
          draggable
        >
          <Zap className="text-blue-500" size={18} />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Trigger</span>
        </div>
        
        <div 
          className="flex items-center gap-3 p-3 border rounded-md bg-white dark:bg-slate-900 cursor-grab hover:border-green-500 transition-colors border-slate-200 dark:border-slate-800 shadow-sm"
          onDragStart={(e) => onDragStart(e, 'message', 'Send Message')} 
          draggable
        >
          <MessageSquare className="text-green-500" size={18} />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Message</span>
        </div>
        
        <div 
          className="flex items-center gap-3 p-3 border rounded-md bg-white dark:bg-slate-900 cursor-grab hover:border-amber-500 transition-colors border-slate-200 dark:border-slate-800 shadow-sm"
          onDragStart={(e) => onDragStart(e, 'delay', 'Smart Delay')} 
          draggable
        >
          <Clock className="text-amber-500" size={18} />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Delay</span>
        </div>
        
        <div 
          className="flex items-center gap-3 p-3 border rounded-md bg-white dark:bg-slate-900 cursor-grab hover:border-purple-500 transition-colors border-slate-200 dark:border-slate-800 shadow-sm"
          onDragStart={(e) => onDragStart(e, 'condition', 'Condition')} 
          draggable
        >
          <GitBranch className="text-purple-500" size={18} />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Condition</span>
        </div>
        
        <div 
          className="flex items-center gap-3 p-3 border rounded-md bg-white dark:bg-slate-900 cursor-grab hover:border-indigo-500 transition-colors border-slate-200 dark:border-slate-800 shadow-sm"
          onDragStart={(e) => onDragStart(e, 'ai', 'AI Agent')} 
          draggable
        >
          <Sparkles className="text-indigo-500" size={18} />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">AI Node</span>
        </div>
      </div>
      <div className="mt-6 text-xs text-slate-500 dark:text-slate-400">
        Drag and drop nodes onto the canvas to build your automation flow.
      </div>
    </aside>
  );
}
