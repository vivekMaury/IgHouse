import React from 'react';
import Link from 'next/link';
import { Plus, Camera, Send, MessageCircle, BarChart3, Activity, ArrowUpRight } from 'lucide-react';

export default function DashboardOverview() {
  const stats = [
    { label: 'Total DMs Sent', value: '12,450', change: '+14.2%', positive: true, icon: Send },
    { label: 'Comments Processed', value: '48,120', change: '+22.4%', positive: true, icon: MessageCircle },
    { label: 'Conversion Rate', value: '4.8%', change: '+1.2%', positive: true, icon: BarChart3 },
    { label: 'Active Automations', value: '12', change: 'Stable', positive: null, icon: Activity },
  ];

  const recentActivity = [
    { id: 1, action: 'DM sent to @creative_studio', flow: 'Welcome Sequence', time: '2 mins ago', status: 'success' },
    { id: 2, action: 'Comment replied on Post #1042', flow: 'Lead Gen Post', time: '15 mins ago', status: 'success' },
    { id: 3, action: 'User completed email capture', flow: 'Summer Promo', time: '1 hour ago', status: 'success' },
    { id: 4, action: 'Flow failed: Rate limit reached', flow: 'Mass Giveaway', time: '2 hours ago', status: 'error' },
    { id: 5, action: 'DM sent to @design_daily', flow: 'Welcome Sequence', time: '3 hours ago', status: 'success' },
  ];

  return (
    <div className="space-y-8 overflow-x-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Dashboard Overview</h1>
          <p className="mt-1 text-sm text-gray-400 sm:text-base">
            Here is what's happening with your Instagram automations today.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10">
            <Camera className="h-4 w-4" />
            Connect IG Account
          </button>
          <Link
            href="/dashboard/flows/new"
            className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-purple-500/20 transition-all hover:from-purple-500 hover:to-pink-500"
          >
            <Plus className="h-4 w-4" />
            Create Flow
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div key={i} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#09090b] p-6">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            <div className="relative z-10 mb-4 flex items-start justify-between">
              <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-gray-400 transition-colors group-hover:bg-purple-500/10 group-hover:text-purple-400">
                <stat.icon className="h-5 w-5" />
              </div>
              <span
                className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                  stat.positive === true
                    ? 'border border-green-500/20 bg-green-500/10 text-green-400'
                    : stat.positive === false
                      ? 'border border-red-500/20 bg-red-500/10 text-red-400'
                      : 'border border-gray-500/20 bg-gray-500/10 text-gray-400'
                }`}
              >
                {stat.positive === true && <ArrowUpRight className="h-3 w-3" />}
                {stat.change}
              </span>
            </div>

            <div className="relative z-10">
              <h3 className="mb-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">{stat.value}</h3>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="col-span-1 flex min-h-[400px] flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#09090b] p-4 sm:p-6 lg:col-span-2">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-white">Engagement Overview</h2>
            <select className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 sm:w-auto">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>All time</option>
            </select>
          </div>

          <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10 [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            <div className="relative z-10 text-center">
              <BarChart3 className="mx-auto mb-3 h-8 w-8 text-gray-600" />
              <p className="text-sm font-medium text-gray-500">Chart visualization will appear here</p>
              <p className="mt-1 text-xs text-gray-600">Connect your Instagram account to see live data</p>
            </div>
          </div>
        </div>

        <div className="col-span-1 overflow-hidden rounded-2xl border border-white/5 bg-[#09090b] p-4 sm:p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            <button className="text-sm text-purple-400 transition-colors hover:text-purple-300">View all</button>
          </div>

          <div className="space-y-6">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="relative flex gap-4 min-w-0">
                <div className="absolute bottom-[-24px] left-[11px] top-8 w-px bg-white/5" />

                <div
                  className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-4 border-[#09090b] ${
                    activity.status === 'success' ? 'bg-purple-500' : 'bg-red-500'
                  }`}
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-[#09090b]" />
                </div>

                <div className="min-w-0 flex-1 pb-1">
                  <p className="text-sm font-medium text-gray-200">{activity.action}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="rounded border border-white/5 bg-white/5 px-2 py-0.5 text-[11px] text-gray-500">
                      {activity.flow}
                    </span>
                    <span className="flex items-center text-[11px] text-gray-500 before:mr-2 before:text-gray-700 before:content-['•']">
                      {activity.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
