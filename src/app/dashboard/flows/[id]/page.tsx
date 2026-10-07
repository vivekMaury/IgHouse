"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  ReactFlow, 
  ReactFlowProvider, 
  addEdge, 
  useNodesState, 
  useEdgesState,
  Controls,
  Background,
  Connection,
  Edge,
  Node
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Save, Play, Pause, ArrowLeft } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

import FlowSidebar from '@/components/flows/FlowSidebar';
import { nodeTypes } from '@/components/flows/CustomNodes';
import Link from 'next/link';

// NOTE: Use your environment variables or import your customized Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const initialNodes = [
  { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { label: 'DM Keyword', description: 'User sends "INFO"' } }
];

export default function FlowCanvasPage({ params }: { params: { id: string } }) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [isActive, setIsActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load flow data from Supabase on mount
  useEffect(() => {
    const fetchFlow = async () => {
      if (params.id === 'new') return; // Skip if new flow
      
      const { data, error } = await supabase
        .from('flows')
        .select('*')
        .eq('id', params.id)
        .single();
        
      if (data && data.nodes_json) {
        const parsed = typeof data.nodes_json === 'string' ? JSON.parse(data.nodes_json) : data.nodes_json;
        if (parsed.nodes) setNodes(parsed.nodes);
        if (parsed.edges) setEdges(parsed.edges);
        setIsActive(data.is_active || false);
      }
    };
    fetchFlow();
  }, [params.id, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/reactflow-label');

      if (typeof type === 'undefined' || !type || !reactFlowInstance) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `node_${Date.now()}`,
        type,
        position,
        data: { label },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const saveFlow = async () => {
    if (!reactFlowInstance) return;
    setIsSaving(true);

    try {
      const flowData = reactFlowInstance.toObject();

      if (params.id === 'new') {
        // Here you would typically insert a new flow
        console.log("Saving new flow", flowData);
      } else {
        const { error } = await supabase
          .from('flows')
          .update({ 
            nodes_json: flowData,
            is_active: isActive,
            updated_at: new Date().toISOString()
          })
          .eq('id', params.id);

        if (error) throw error;
      }
      // Consider replacing alert with a nice toast notification
      alert('Flow saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Error saving flow.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActiveStatus = async () => {
    const nextActiveState = !isActive;
    setIsActive(nextActiveState);

    if (params.id === 'new') return;

    try {
      const { error } = await supabase
        .from('flows')
        .update({ is_active: nextActiveState })
        .eq('id', params.id);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating flow status:', err);
      setIsActive(!nextActiveState);
      alert('Error updating flow status.');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top Header */}
      <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4 z-10">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/flows" className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="font-semibold text-lg text-slate-800 dark:text-slate-200">Visual Flow Builder</h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleActiveStatus}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${
              isActive 
                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' 
                : 'bg-white text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700'
            }`}
          >
            {isActive ? <Pause size={16} /> : <Play size={16} />}
            {isActive ? 'Active' : 'Paused'}
          </button>
          
          <button 
            onClick={saveFlow}
            disabled={isSaving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save Flow'}
          </button>
        </div>
      </header>

      {/* Main Canvas Area */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 h-full" ref={reactFlowWrapper}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              fitView
              className="bg-slate-50 dark:bg-slate-950"
            >
              <Background color="#ccc" gap={16} />
              <Controls className="bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700 fill-slate-800 dark:fill-slate-200" />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
        <FlowSidebar />
      </div>
    </div>
  );
}
