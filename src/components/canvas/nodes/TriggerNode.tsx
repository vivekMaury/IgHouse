import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react';
import { Copy, MessageSquareText, Trash2, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

export type TriggerNodeData = {
  label?: string;
  subtitle?: string;
  accent?: string;
  triggerEvent?: 'Comment Keyword' | 'Story Mention' | 'Direct DM';
  keywords?: string;
  onChange?: (field: string, value: string) => void;
};

export function TriggerNode({ data, id, selected }: NodeProps<any>) {
  const typedData = (data ?? {}) as TriggerNodeData;
  const [triggerEvent, setTriggerEvent] = useState(typedData.triggerEvent ?? 'Comment Keyword');
  const [keywords, setKeywords] = useState(typedData.keywords ?? 'PRICE, INFO, LINK');
  const [hovered, setHovered] = useState(false);
  const { setNodes, deleteElements } = useReactFlow();

  const showActions = selected || hovered;

  const handleDuplicate = () => {
    const nextId = `${id}-copy-${Date.now()}`;

    setNodes((currentNodes) => {
      const current = currentNodes.find((node) => node.id === id);
      if (!current) {
        return currentNodes;
      }

      return [
        ...currentNodes,
        {
          ...current,
          id: nextId,
          position: {
            x: current.position.x + 30,
            y: current.position.y + 30,
          },
          selected: false,
        },
      ];
    });
  };

  const handleDelete = () => {
    deleteElements({ nodes: [{ id }] });
  };

  useEffect(() => {
    setTriggerEvent(typedData.triggerEvent ?? 'Comment Keyword');
    setKeywords(typedData.keywords ?? 'PRICE, INFO, LINK');
  }, [typedData.triggerEvent, typedData.keywords]);

  const handleTriggerChange = (value: string) => {
    const nextValue = (value ?? 'Comment Keyword') as NonNullable<TriggerNodeData['triggerEvent']>;
    setTriggerEvent(nextValue);
    typedData.onChange?.('triggerEvent', nextValue);
  };

  const handleKeywordChange = (value: string) => {
    setKeywords(value);
    typedData.onChange?.('keywords', value);
  };

  return (
    <div
      className={`relative w-[280px] rounded-2xl border border-white/10 bg-[#0b1220]/85 p-3 shadow-[0_0_25px_rgba(168,85,247,0.15)] backdrop-blur-xl ${
        selected ? 'ring-2 ring-violet-500/60' : ''
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {showActions && (
        <div className="absolute -top-3 right-2 z-10 flex items-center gap-1 rounded-lg border border-white/10 bg-slate-950/90 p-1 shadow-lg backdrop-blur-sm">
          <button
            type="button"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              handleDuplicate();
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-200 transition-colors hover:border-violet-400 hover:text-violet-200"
            aria-label="Duplicate trigger node"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              handleDelete();
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-200 transition-colors hover:border-red-400 hover:text-red-300"
            aria-label="Delete trigger node"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-violet-400 to-transparent" />
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !border-0 !bg-violet-400" />

      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 shadow-lg shadow-violet-500/30">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300">Trigger</p>
            <h3 className="text-sm font-semibold text-white">{typedData.label ?? 'Trigger Node'}</h3>
          </div>
        </div>
        <span className="h-2.5 w-2.5 rounded-full bg-violet-400 shadow-[0_0_12px_rgba(168,85,247,0.9)]" />
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-slate-400">Event</label>
          <select
            value={triggerEvent}
            onChange={(event) => handleTriggerChange(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-2.5 py-2 text-xs text-slate-100 outline-none transition-colors focus:border-violet-400"
          >
            <option>Comment Keyword</option>
            <option>Story Mention</option>
            <option>Direct DM</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-slate-400">Target keywords</label>
          <input
            value={keywords}
            onChange={(event) => handleKeywordChange(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-2.5 py-2 text-xs text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-violet-400"
            placeholder="PRICE, INFO, LINK"
          />
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !border-0 !bg-violet-400" />
    </div>
  );
}
