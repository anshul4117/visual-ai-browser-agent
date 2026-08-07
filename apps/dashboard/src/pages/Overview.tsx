import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchOverview } from '../api/client';
import { StatCard } from '../components/ui/StatCard';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { Badge } from '../components/ui/Badge';
import {
  Clock,
  MousePointerClick,
  Image,
  Sparkles,
  Award,
  Zap,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

const CATEGORY_COLORS = ['#38BDF8', '#818CF8', '#34D399', '#FBBF24', '#F472B6'];

export const OverviewPage: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['overview'],
    queryFn: fetchOverview,
    refetchInterval: 10000,
  });

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (error || !data) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
        Failed to load overview data. Please check backend server.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">System Overview</h2>
        <p className="text-xs text-slate-400">Real-time status metrics and aggregated browser activity intelligence</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Sessions"
          value={data.totalSessions}
          subtitle="Active browsing sessions"
          icon={Clock}
          color="indigo"
        />
        <StatCard
          title="Total Events"
          value={data.totalEvents}
          subtitle="Captured DOM activity events"
          icon={MousePointerClick}
          color="cyan"
        />
        <StatCard
          title="Screenshots"
          value={data.totalScreenshots}
          subtitle="Visual context captures"
          icon={Image}
          color="emerald"
        />
        <StatCard
          title="AI Analyses"
          value={data.totalAnalyses}
          subtitle="Gemini Vision evaluations"
          icon={Sparkles}
          color="purple"
        />
        <StatCard
          title="Avg Productivity"
          value={`${data.averageProductivityScore}%`}
          subtitle="Productivity metric"
          icon={Award}
          color="amber"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events per Hour Area Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>Events Activity Timeline (24 Hours)</span>
              </h3>
              <p className="text-xs text-slate-400">Activity volume by hour of day</p>
            </div>
            <Badge label="Real-time" variant="cyan" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.eventsPerHour} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B0F17', borderColor: '#1E293B', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="count" stroke="#38BDF8" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Categories Distribution */}
        <div className="p-6 rounded-2xl glass-card space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Activity Categories</span>
            </h3>
            <p className="text-xs text-slate-400">AI-classified productivity breakdown</p>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topCategories} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <XAxis type="number" stroke="#475569" fontSize={10} hide />
                <YAxis type="category" dataKey="category" stroke="#94A3B8" fontSize={11} tickLine={false} width={90} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B0F17', borderColor: '#1E293B', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="percentage" radius={[0, 8, 8, 0]}>
                  {data.topCategories.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            {data.topCategories.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">{cat.category}</span>
                <span className="text-slate-400 font-mono">{cat.percentage}% ({cat.count})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
