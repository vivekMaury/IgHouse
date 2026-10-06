'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  EdgeLabelRenderer,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  getSmoothStepPath,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeProps,
  type Node,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { nodeTypes as customNodeTypes } from '@/components/canvas/nodes';
import { getWorkflowById, saveWorkflow, type FlowData } from '@/app/actions/flow-actions';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  GitBranch,
  Menu,
  MessageSquareText,
  Pause,
  Play,
  Plus,
  Save,
  Sparkles,
  TimerReset,
  X,
  Zap,
} from 'lucide-react';

const paletteItems = [
  {
    type: 'trigger',
    label: 'Comment Keyword',
    subtitle: 'Trigger Node',
    icon: Zap,
    accent: 'from-purple-500 to-pink-500',
  },
  {
    type: 'trigger',
    label: 'Story Mention',
    subtitle: 'Trigger Node',
    icon: Sparkles,
    accent: 'from-violet-500 to-purple-500',
  },
  {
    type: 'trigger',
    label: 'Direct DM',
    subtitle: 'Trigger Node',
    icon: MessageSquareText,
    accent: 'from-fuchsia-500 to-pink-500',
  },
  {
    type: 'message',
    label: 'Send DM',
    subtitle: 'Message Node',
    icon: MessageSquareText,
    accent: 'from-cyan-500 to-blue-500',
  },
  {
    type: 'message',
    label: 'Quick Replies',
    subtitle: 'Message Node',
    icon: Plus,
    accent: 'from-sky-500 to-cyan-500',
  },
  {
    type: 'message',
    label: 'Image Button',
    subtitle: 'Message Node',
    icon: Sparkles,
    accent: 'from-indigo-500 to-violet-500',
  },
  {
    type: 'condition',
    label: 'If user follows page',
    subtitle: 'Condition Node',
    icon: GitBranch,
    accent: 'from-amber-500 to-orange-500',
  },
  {
    type: 'condition',
    label: 'Has email',
    subtitle: 'Condition Node',
    icon: Check,
    accent: 'from-emerald-500 to-teal-500',
  },
  {
    type: 'delay',
    label: 'Wait 5 mins',
    subtitle: 'Delay Node',
    icon: Clock3,
    accent: 'from-rose-500 to-pink-500',
  },
];

const nodeTypes = customNodeTypes;

const initialNodes: Node[] = [
  {
    id: 'trigger-1',
    type: 'trigger',
    position: { x: 120, y: 80 },
    data: {
      label: 'Comment Keyword',
      subtitle: 'Trigger Node',
      accent: 'from-purple-500 to-pink-500',
    },
  },
  {
    id: 'message-1',
    type: 'message',
    position: { x: 420, y: 180 },
    data: {
      label: 'Send DM',
      subtitle: 'Message Node',
      accent: 'from-cyan-500 to-blue-500',
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e-trigger-1-message-1',
    source: 'trigger-1',
    target: 'message-1',
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: '#8b5cf6', strokeWidth: 2 },
  },
];

const createNodeFromType = (type: string, position: { x: number; y: number }, id: string): Node => {
  const baseNode: Record<string, Partial<Node>> = {
    trigger: {
      type: 'trigger',
      data: {
        label: 'Comment Keyword',
        subtitle: 'Trigger Node',
        accent: 'from-purple-500 to-pink-500',
      },
    },
    message: {
      type: 'message',
      data: {
        label: 'Send DM',
        subtitle: 'Message Node',
        accent: 'from-cyan-500 to-blue-500',
      },
    },
    condition: {
      type: 'condition',
      data: {
        label: 'If user follows page',
        subtitle: 'Condition Node',
        accent: 'from-amber-500 to-orange-500',
      },
    },
    delay: {
      type: 'delay',
      data: {
        label: 'Wait 5 mins',
        subtitle: 'Delay Node',
        accent: 'from-rose-500 to-pink-500',
      },
    },
  };

  const template = baseNode[type] ?? baseNode.trigger;

  return {
    id,
    ...template,
    position,
  } as Node;
};

const hasTriggerNode = (nodes: Node[]) => nodes.some((node) => node.type === 'trigger');

function DeleteEdge({
  id,
  selected,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
}: EdgeProps) {
  const { setEdges } = useReactFlow();
  const [hovered, setHovered] = useState(false);
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const handleDelete = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setEdges((currentEdges) => currentEdges.filter((edge) => edge.id !== id));
  };

  return (
    <>
      <path
        d={path}
        fill="none"
        stroke={selected ? '#c084fc' : '#8b5cf6'}
        strokeWidth={selected ? 3 : 2.2}
        strokeLinecap="round"
        markerEnd={markerEnd}
        className="react-flow__edge-path"
      />

      {(selected || hovered) && (
        <EdgeLabelRenderer>
          <button
            type="button"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={handleDelete}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
              position: 'absolute',
              left: labelX,
              top: labelY,
              transform: 'translate(-50%, -50%)',
            }}
            className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-xs text-white shadow-lg transition hover:border-red-400 hover:text-red-300"
            aria-label="Delete edge"
          >
            ×
          </button>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

function NewFlowPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const workflowId = searchParams.get('id');
  const reactFlowWrapperRef = useRef<HTMLDivElement>(null);
  const [flowTitle, setFlowTitle] = useState('Story Mention Auto-DM');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const loadWorkflow = async () => {
      if (!workflowId || workflowId === 'new') {
        return;
      }

      try {
        const record = await getWorkflowById(workflowId);

        if (!record) {
          return;
        }

        const flowData = (record.flow_data ?? { nodes: [], edges: [] }) as FlowData;
        const loadedNodes = Array.isArray(flowData.nodes) ? (flowData.nodes as Node[]) : [];
        const loadedEdges = Array.isArray(flowData.edges) ? (flowData.edges as Edge[]) : [];

        if (loadedNodes.length) {
          setNodes(loadedNodes);
        }

        if (loadedEdges.length) {
          setEdges(loadedEdges);
        }

        if (record.name) {
          setFlowTitle(record.name);
        }

        setIsActive(record.status === 'active');
      } catch (error) {
        console.error('Failed to load workflow', error);
        setToast({ type: 'error', message: 'Unable to load this workflow.' });
      }
    };

    loadWorkflow();
  }, [workflowId, setEdges, setNodes]);

  const onConnect = useCallback(
    (connection: Connection | Edge) =>
      setEdges((currentEdges) =>
        addEdge(
          {
            ...connection,
            type: 'smoothstep',
            animated: true,
            deletable: true,
            markerEnd: { type: MarkerType.ArrowClosed },
          },
          currentEdges,
        ),
      ),
    [setEdges],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }

      if (event.key !== 'Delete' && event.key !== 'Backspace') {
        return;
      }

      const hasSelectedNodes = nodes.some((node) => node.selected);
      const hasSelectedEdges = edges.some((edge) => edge.selected);

      if (!hasSelectedNodes && !hasSelectedEdges) {
        return;
      }

      event.preventDefault();

      if (hasSelectedNodes) {
        setNodes((currentNodes) => currentNodes.filter((node) => !node.selected));
      }

      if (hasSelectedEdges) {
        setEdges((currentEdges) => currentEdges.filter((edge) => !edge.selected));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [edges, nodes, setEdges, setNodes]);

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/reactflow-label');

      if (!type || !reactFlowInstance || !reactFlowWrapperRef.current) return;

      const bounds = reactFlowWrapperRef.current.getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const newNode = createNodeFromType(type, position, `node-${Date.now()}`);
      if (label) {
        newNode.data = {
          ...newNode.data,
          label,
        };
      }

      setNodes((currentNodes) => [...currentNodes, newNode]);
    },
    [reactFlowInstance, setNodes],
  );

  const onDragStart = useCallback((event: React.DragEvent<HTMLButtonElement>, type: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', type);
    event.dataTransfer.setData('application/reactflow-label', label);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleSave = useCallback(async () => {
    if (!hasTriggerNode(nodes)) {
      setToast({ type: 'error', message: 'Your flow must include at least one trigger node before saving.' });
      return;
    }

    setIsSaving(true);

    try {
      const savedFlow = await saveWorkflow({
        id: workflowId ?? undefined,
        name: flowTitle.trim() || 'Untitled Workflow',
        flowData: {
          nodes,
          edges,
        },
        status: isActive ? 'active' : 'draft',
      });

      const nextWorkflowId = typeof savedFlow?.id === 'string' ? savedFlow.id : workflowId;

      if (!workflowId && nextWorkflowId) {
        router.replace(`/dashboard/flows/new?id=${nextWorkflowId}`);
      }

      setToast({
        type: 'success',
        message: isActive ? 'Flow saved and published successfully.' : 'Flow saved as draft.',
      });
    } catch (error: any) {
      setToast({
        type: 'error',
        message: error?.message || 'Unable to save this flow.',
      });
    } finally {
      setIsSaving(false);
    }
  }, [edges, flowTitle, isActive, nodes, router, workflowId]);

  const statusBadge = useMemo(
    () =>
      isActive
        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
        : 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    [isActive],
  );

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#030712]">
      <header className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#09090b]/80 px-3 py-3 backdrop-blur-xl sm:gap-4 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            href="/dashboard/flows"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition-colors hover:text-white sm:h-9 sm:w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => setIsPaletteOpen((value) => !value)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 md:hidden"
            aria-label="Toggle node palette"
          >
            {isPaletteOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <div className="min-w-0 flex-1">
            <label className="block text-[9px] font-medium uppercase tracking-[0.22em] text-slate-400 sm:text-[10px]">
              Flow title
            </label>
            <input
              value={flowTitle}
              onChange={(event) => setFlowTitle(event.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-500 sm:text-base"
              placeholder="Enter flow title"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsActive((value) => !value)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors sm:gap-2 sm:px-3 sm:py-2 sm:text-sm ${statusBadge}`}
          >
            {isActive ? <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Pause className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
            {isActive ? 'Active' : 'Inactive'}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:from-purple-500 hover:to-pink-500 disabled:cursor-not-allowed disabled:opacity-70 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
          >
            <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {isSaving ? 'Saving...' : 'Save & Publish'}
          </button>
        </div>
      </header>

      <div className="relative flex flex-1 overflow-hidden">
        <aside
          className={`hidden border-r border-white/10 bg-[#09090b]/90 p-4 md:flex md:flex-col ${
            isPaletteCollapsed ? 'w-16' : 'w-[286px]'
          } transition-all duration-200`}
        >
          <div className="mb-4 flex items-center justify-between">
            {!isPaletteCollapsed && (
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                Palette
              </h2>
            )}
            <button
              type="button"
              onClick={() => setIsPaletteCollapsed((value) => !value)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition-colors hover:text-white"
              aria-label={isPaletteCollapsed ? 'Expand palette' : 'Collapse palette'}
            >
              {isPaletteCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
            {!isPaletteCollapsed && (
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                {paletteItems.length} nodes
              </span>
            )}
          </div>

          {!isPaletteCollapsed && (
            <div className="space-y-3">
              {paletteItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={`${item.type}-${item.label}`}
                    type="button"
                    draggable
                    onDragStart={(event) => onDragStart(event, item.type, item.label)}
                    className="group flex w-full cursor-grab items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition-all hover:border-purple-500/40 hover:bg-white/10 active:cursor-grabbing"
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${item.accent}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white">{item.label}</div>
                      <div className="text-[11px] uppercase tracking-[0.14em] text-slate-400">{item.subtitle}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {isPaletteOpen && (
          <div className="absolute inset-x-0 bottom-0 z-20 rounded-t-3xl border-t border-white/10 bg-[#09090b]/95 p-4 shadow-2xl backdrop-blur-xl md:hidden">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Palette</h2>
              <button
                type="button"
                onClick={() => setIsPaletteOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300"
                aria-label="Close node palette"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {paletteItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={`${item.type}-${item.label}-mobile`}
                    type="button"
                    draggable
                    onDragStart={(event) => onDragStart(event, item.type, item.label)}
                    onClick={() => setIsPaletteOpen(false)}
                    className="group flex w-full cursor-grab items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition-all hover:border-purple-500/40 hover:bg-white/10 active:cursor-grabbing"
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${item.accent}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white">{item.label}</div>
                      <div className="text-[11px] uppercase tracking-[0.14em] text-slate-400">{item.subtitle}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="relative flex-1 overflow-hidden">
          {toast && (
            <div
              className={`absolute left-4 top-4 z-20 max-w-sm rounded-xl border px-3 py-2 text-sm shadow-lg backdrop-blur-md ${
                toast.type === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                  : 'border-red-500/30 bg-red-500/10 text-red-200'
              }`}
            >
              {toast.message}
            </div>
          )}

          <div className="h-full w-full" ref={reactFlowWrapperRef} onDragOver={onDragOver} onDrop={onDrop}>
            <ReactFlowProvider>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={setReactFlowInstance}
                fitView
                fitViewOptions={{ padding: 0.3 }}
                nodeTypes={nodeTypes as any}
                className="bg-[#030712]"
                defaultEdgeOptions={{
                  type: 'smoothstep',
                  animated: true,
                  deletable: true,
                  reconnectable: true,
                  markerEnd: { type: MarkerType.ArrowClosed },
                }}
                edgeTypes={{ smoothstep: DeleteEdge } as any}
                edgesReconnectable={true}
                proOptions={{ hideAttribution: true }}
              >
                <Background color="#334155" gap={18} size={1.2} variant={BackgroundVariant.Dots} />
                <MiniMap
                  pannable
                  zoomable
                  nodeColor={(node) => {
                    const scheme: Record<string, string> = {
                      trigger: '#8b5cf6',
                      message: '#38bdf8',
                      condition: '#f59e0b',
                      delay: '#fb7185',
                    };
                    return scheme[node.type as keyof typeof scheme] ?? '#8b5cf6';
                  }}
                  className="!bg-slate-900/80 !border !border-white/10 !rounded-xl"
                />
                <Controls
                  className="!bg-slate-900/80 !border !border-slate-700 !rounded-xl !text-white"
                  position="bottom-left"
                />
              </ReactFlow>
            </ReactFlowProvider>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewFlowPage() {
  return (
    <Suspense fallback={null}>
      <NewFlowPageContent />
    </Suspense>
  );
}
