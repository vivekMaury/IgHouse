import { Handle, Position } from '@xyflow/react';
import { MessageSquare, Zap, Clock, GitBranch, Sparkles } from 'lucide-react';

const nodeStyles = "px-4 py-2 shadow-md rounded-md bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 min-w-[150px]";

export function TriggerNode({ data }: any) {
  return (
    <div className={`${nodeStyles} border-blue-500`}>
      <div className="flex items-center gap-2 font-semibold text-blue-600 dark:text-blue-400">
        <Zap size={16} />
        {data.label}
      </div>
      <div className="text-sm mt-2 text-slate-500">{data.description || "Trigger event"}</div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500" />
    </div>
  );
}

export function MessageNode({ data }: any) {
  return (
    <div className={`${nodeStyles} border-green-500`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-green-500" />
      <div className="flex items-center gap-2 font-semibold text-green-600 dark:text-green-400">
        <MessageSquare size={16} />
        {data.label}
      </div>
      <div className="text-sm mt-2 text-slate-500 truncate max-w-[200px]">{data.message || "Message content..."}</div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-green-500" />
    </div>
  );
}

export function DelayNode({ data }: any) {
  return (
    <div className={`${nodeStyles} border-amber-500`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-amber-500" />
      <div className="flex items-center gap-2 font-semibold text-amber-600 dark:text-amber-400">
        <Clock size={16} />
        {data.label}
      </div>
      <div className="text-sm mt-2 text-slate-500">Wait: {data.duration || "5 minutes"}</div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-amber-500" />
    </div>
  );
}

export function ConditionNode({ data }: any) {
  return (
    <div className={`${nodeStyles} border-purple-500`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-purple-500" />
      <div className="flex items-center gap-2 font-semibold text-purple-600 dark:text-purple-400">
        <GitBranch size={16} />
        {data.label}
      </div>
      <div className="text-sm mt-2 text-slate-500">{data.condition || "Condition..."}</div>
      <Handle type="source" position={Position.Bottom} id="true" className="w-3 h-3 bg-purple-500 left-1/3" />
      <Handle type="source" position={Position.Bottom} id="false" className="w-3 h-3 bg-slate-400 right-1/3" />
    </div>
  );
}

export function AINode({ data }: any) {
  return (
    <div className={`${nodeStyles} border-indigo-500`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-indigo-500" />
      <div className="flex items-center gap-2 font-semibold text-indigo-600 dark:text-indigo-400">
        <Sparkles size={16} />
        {data.label}
      </div>
      <div className="text-sm mt-2 text-slate-500 line-clamp-2 max-w-[200px]">{data.prompt || "AI Prompt..."}</div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-500" />
    </div>
  );
}

export const nodeTypes = {
  trigger: TriggerNode,
  message: MessageNode,
  delay: DelayNode,
  condition: ConditionNode,
  ai: AINode,
};
