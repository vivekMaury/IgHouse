import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react';
import { Copy, MessageSquareText, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export type MessageNodeData = {
  label?: string;
  subtitle?: string;
  accent?: string;
  message?: string;
  quickReplies?: string[];
  onChange?: (field: string, value: string | string[]) => void;
};

export function MessageNode({ data, id, selected }: NodeProps<any>) {
  const typedData = (data ?? {}) as MessageNodeData;
  const [message, setMessage] = useState(typedData.message ?? 'Hi! Thanks for your message. Want to book a quick call?');
  const [quickReplies, setQuickReplies] = useState<string[]>(typedData.quickReplies ?? ['Book a Call', 'Learn More']);
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
    setMessage(typedData.message ?? 'Hi! Thanks for your message. Want to book a quick call?');
    setQuickReplies(typedData.quickReplies ?? ['Book a Call', 'Learn More']);
  }, [typedData.message, typedData.quickReplies]);

  const updateMessage = (value: string) => {
    setMessage(value);
    typedData.onChange?.('message', value);
  };

  const updateQuickReplies = (nextButtons: string[]) => {
    setQuickReplies(nextButtons);
    typedData.onChange?.('quickReplies', nextButtons);
  };

  const addQuickReply = () => {
    const next = [...quickReplies, `Option ${quickReplies.length + 1}`];
    updateQuickReplies(next);
  };

  const removeQuickReply = (indexToRemove: number) => {
    const next = quickReplies.filter((_, index) => index !== indexToRemove);
    updateQuickReplies(next.length ? next : ['Learn More']);
  };

  return (
    <div
      className={`relative w-[300px] rounded-2xl border border-white/10 bg-[#0b1220]/85 p-3 shadow-[0_0_25px_rgba(34,211,238,0.15)] backdrop-blur-xl ${
        selected ? 'ring-2 ring-cyan-500/60' : ''
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
            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-200 transition-colors hover:border-cyan-400 hover:text-cyan-200"
            aria-label="Duplicate message node"
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
            aria-label="Delete message node"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !border-0 !bg-cyan-400" />

      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/30">
            <MessageSquareText className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">Message</p>
            <h3 className="text-sm font-semibold text-white">{typedData.label ?? 'Message Node'}</h3>
          </div>
        </div>
        <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-slate-400">DM Text</label>
          <textarea
            value={message}
            onChange={(event) => updateMessage(event.target.value)}
            rows={4}
            className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-2.5 py-2 text-xs text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-400"
            placeholder="Write the DM text for the auto-reply..."
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Quick Replies</label>
            <button
              type="button"
              onClick={addQuickReply}
              className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[10px] font-medium text-cyan-200 transition-colors hover:bg-cyan-500/20"
            >
              <Plus className="h-3 w-3" />
              Add
            </button>
          </div>

          <div className="space-y-2">
            {quickReplies.map((reply, index) => (
              <div key={`${reply}-${index}`} className="flex items-center gap-2">
                <input
                  value={reply}
                  onChange={(event) => {
                    const next = [...quickReplies];
                    next[index] = event.target.value;
                    updateQuickReplies(next);
                  }}
                  className="flex-1 rounded-lg border border-white/10 bg-slate-950/70 px-2.5 py-2 text-[11px] text-slate-100 outline-none focus:border-cyan-400"
                />
                {quickReplies.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuickReply(index)}
                    className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 transition-colors hover:border-red-500/40 hover:text-red-300"
                    aria-label={`Remove ${reply}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !border-0 !bg-cyan-400" />
    </div>
  );
}
