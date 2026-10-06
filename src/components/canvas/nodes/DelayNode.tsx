import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react';
import { Copy, TimerReset, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export type DelayNodeData = {
  label?: string;
  subtitle?: string;
  accent?: string;
  duration?: number;
  unit?: 'Minutes' | 'Hours';
  onChange?: (field: string, value: string | number) => void;
};

export function DelayNode({ data, id, selected }: NodeProps<any>) {
  const typedData = (data ?? {}) as DelayNodeData;
  const [duration, setDuration] = useState<number>(typedData.duration ?? 5);
  const [unit, setUnit] = useState<'Minutes' | 'Hours'>(typedData.unit ?? 'Minutes');
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
    setDuration(typedData.duration ?? 5);
    setUnit(typedData.unit ?? 'Minutes');
  }, [typedData.duration, typedData.unit]);

  const handleDurationChange = (value: string) => {
    const nextValue = Number(value) || 0;
    setDuration(nextValue);
    typedData.onChange?.('duration', nextValue);
  };

  const handleUnitChange = (value: 'Minutes' | 'Hours') => {
    setUnit(value);
    typedData.onChange?.('unit', value);
  };

  return (
    <div
      className={`relative w-[240px] rounded-2xl border border-white/10 bg-[#0b1220]/85 p-3 shadow-[0_0_25px_rgba(244,114,182,0.15)] backdrop-blur-xl ${
        selected ? 'ring-2 ring-pink-500/60' : ''
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
            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-200 transition-colors hover:border-pink-400 hover:text-pink-200"
            aria-label="Duplicate delay node"
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
            aria-label="Delete delay node"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-pink-400 to-transparent" />
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !border-0 !bg-pink-400" />

      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg shadow-pink-500/30">
            <TimerReset className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-pink-300">Delay</p>
            <h3 className="text-sm font-semibold text-white">{typedData.label ?? 'Delay Node'}</h3>
          </div>
        </div>
        <span className="h-2.5 w-2.5 rounded-full bg-pink-400 shadow-[0_0_12px_rgba(244,114,182,0.9)]" />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          step={1}
          value={duration}
          onChange={(event) => handleDurationChange(event.target.value)}
          className="w-20 rounded-xl border border-white/10 bg-slate-950/70 px-2.5 py-2 text-xs text-slate-100 outline-none focus:border-pink-400"
        />

        <select
          value={unit}
          onChange={(event) => handleUnitChange(event.target.value as 'Minutes' | 'Hours')}
          className="flex-1 rounded-xl border border-white/10 bg-slate-950/70 px-2.5 py-2 text-xs text-slate-100 outline-none focus:border-pink-400"
        >
          <option>Minutes</option>
          <option>Hours</option>
        </select>
      </div>

      <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !border-0 !bg-pink-400" />
    </div>
  );
}
