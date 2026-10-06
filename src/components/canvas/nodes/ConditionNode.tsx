import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react';
import { Copy, GitBranch, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export type ConditionNodeData = {
  label?: string;
  subtitle?: string;
  accent?: string;
  rule?: 'User Follows Page' | 'Email Captured';
  onChange?: (field: string, value: string) => void;
};

export function ConditionNode({ data, id, selected }: NodeProps<any>) {
  const typedData = (data ?? {}) as ConditionNodeData;
  const [rule, setRule] = useState(typedData.rule ?? 'User Follows Page');
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
    setRule(typedData.rule ?? 'User Follows Page');
  }, [typedData.rule]);

  const handleRuleChange = (value: string) => {
    const nextValue = (value ?? 'User Follows Page') as NonNullable<ConditionNodeData['rule']>;
    setRule(nextValue);
    typedData.onChange?.('rule', nextValue);
  };

  return (
    <div
      className={`relative w-[300px] rounded-2xl border border-white/10 bg-[#0b1220]/85 p-3 shadow-[0_0_25px_rgba(251,191,36,0.15)] backdrop-blur-xl ${
        selected ? 'ring-2 ring-amber-500/60' : ''
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
            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-200 transition-colors hover:border-amber-400 hover:text-amber-200"
            aria-label="Duplicate condition node"
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
            aria-label="Delete condition node"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !border-0 !bg-amber-400" />

      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30">
            <GitBranch className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300">Condition</p>
            <h3 className="text-sm font-semibold text-white">{typedData.label ?? 'Condition Node'}</h3>
          </div>
        </div>
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)]" />
      </div>

      <div>
        <label className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-slate-400">Rule</label>
        <select
          value={rule}
          onChange={(event) => handleRuleChange(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-2.5 py-2 text-xs text-slate-100 outline-none transition-colors focus:border-amber-400"
        >
          <option>User Follows Page</option>
          <option>Email Captured</option>
        </select>
      </div>

      <Handle
        type="source"
        id="true"
        position={Position.Bottom}
        style={{ left: '30%', bottom: -10, backgroundColor: '#22c55e', width: 12, height: 12, border: 'none' }}
      />
      <Handle
        type="source"
        id="false"
        position={Position.Bottom}
        style={{ left: '70%', bottom: -10, backgroundColor: '#ef4444', width: 12, height: 12, border: 'none' }}
      />
    </div>
  );
}
