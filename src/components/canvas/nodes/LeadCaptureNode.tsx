import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import { Copy, UserRound, Trash2 } from "lucide-react";
import { useState } from "react";

export function LeadCaptureNode({ data, id, selected }: NodeProps) {
  const [hovered, setHovered] = useState(false);
  const { setNodes, deleteElements } = useReactFlow();

  const duplicate = () => {
    setNodes((nodes) => {
      const current = nodes.find((node) => node.id === id);
      if (!current) return nodes;

      return [
        ...nodes,
        {
          ...current,
          id: `${id}-copy-${Date.now()}`,
          position: { x: current.position.x + 30, y: current.position.y + 30 },
          selected: false,
        },
      ];
    });
  };

  return (
    <div
      className={`relative w-[280px] rounded-2xl border border-white/10 bg-[#0b1220]/85 p-3 shadow-[0_0_25px_rgba(16,185,129,0.15)] backdrop-blur-xl ${
        selected ? "ring-2 ring-emerald-500/60" : ""
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {(selected || hovered) && (
        <div className="absolute -top-3 right-2 z-10 flex items-center gap-1 rounded-lg border border-white/10 bg-slate-950/90 p-1 shadow-lg">
          <button
            aria-label="Duplicate lead capture node"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-200 hover:border-emerald-400 hover:text-emerald-200"
            onClick={duplicate}
            onMouseDown={(event) => event.stopPropagation()}
            type="button"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            aria-label="Delete lead capture node"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-200 hover:border-red-400 hover:text-red-300"
            onClick={() => deleteElements({ nodes: [{ id }] })}
            onMouseDown={(event) => event.stopPropagation()}
            type="button"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <Handle
        className="!h-3 !w-3 !border-0 !bg-emerald-400"
        position={Position.Top}
        type="target"
      />
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
          <UserRound className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Lead Capture
          </p>
          <h3 className="text-sm font-semibold text-white">
            Detect email or phone
          </h3>
        </div>
      </div>
      <p className="text-xs leading-5 text-slate-400">
        Saves contact details from an incoming Instagram DM and exports the
        lead to configured workspace integrations.
      </p>
      <Handle
        className="!h-3 !w-3 !border-0 !bg-emerald-400"
        position={Position.Bottom}
        type="source"
      />
    </div>
  );
}
