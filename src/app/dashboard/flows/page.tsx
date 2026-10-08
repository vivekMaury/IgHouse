'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Layers3,
  Plus,
  Sparkles,
  Zap,
} from 'lucide-react';
import { listWorkflows, type WorkflowRecord } from '@/app/actions/flow-actions';

const formatTimestamp = (value?: string | null) => {
  if (!value) {
    return 'Recently';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Recently';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

export default function FlowsPage() {
  const [flows, setFlows] = useState<WorkflowRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFlows = async () => {
      try {
        const records = await listWorkflows();
        setFlows(records);
      } catch (error) {
        console.error('Failed to load workflows', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFlows();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-purple-300">
            Automation Flows
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Workflow library</h1>
        </div>

        <Link
          href="/dashboard/flows/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:from-purple-500 hover:to-pink-500"
        >
          <Plus className="h-4 w-4" />
          Create New Flow
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-64 animate-pulse rounded-2xl border border-white/10 bg-[#09090b]"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {flows.map((flow) => {
            const isActive =
              (flow.status === 'active' || flow.status === 'published') &&
              flow.is_active === true;
            const nodeCount = Array.isArray(flow.flow_data?.nodes) ? flow.flow_data.nodes.length : 0;

            return (
              <div
                key={flow.id}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-[#09090b] shadow-lg shadow-black/10 transition-all hover:-translate-y-1 hover:border-purple-500/40"
              >
                <div className="h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-5">
                  <div className="flex items-center justify-between">
                    <div className="rounded-lg border border-white/10 bg-black/10 p-2 text-white backdrop-blur-sm">
                      <Zap className="h-5 w-5" />
                    </div>
                    <span
                      className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                        isActive
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                          : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                      }`}
                    >
                      {isActive ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{flow.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Workflow canvas with {nodeCount} node{nodeCount === 1 ? '' : 's'}.
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span className="inline-flex items-center gap-2">
                      <Layers3 className="h-4 w-4 text-purple-300" />
                      {nodeCount} nodes
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <CalendarClock className="h-4 w-4 text-slate-500" />
                      {formatTimestamp(flow.updated_at)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/10 pt-4">
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-purple-300">
                      <CheckCircle2 className="h-4 w-4" />
                      {isActive ? 'Ready' : 'Draft'}
                    </span>

                    <Link
                      href={`/dashboard/flows/new?id=${flow.id}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-white transition-colors hover:text-purple-300"
                    >
                      Edit Flow
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {flows.length === 0 && (
            <div className="md:col-span-2 xl:col-span-3">
              <div className="rounded-2xl border border-dashed border-purple-500/30 bg-purple-500/5 p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10 text-purple-300">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">Build smarter automations</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Design lead funnels, DM replies, and comment triggers with the visual canvas builder.
                </p>
                <Link
                  href="/dashboard/flows/new"
                  className="mt-5 inline-flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-200 transition-colors hover:bg-purple-500/20"
                >
                  Launch builder
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
