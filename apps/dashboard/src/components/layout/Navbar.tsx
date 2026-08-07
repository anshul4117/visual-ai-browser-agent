import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchHealth } from '../../api/client';
import { Cpu, Database, Activity, RefreshCw } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { data: health, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 15000,
  });

  const isDbConnected = health?.services?.database === 'connected';

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#0B0F17]/90 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Visual AI Browser Agent</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
              v1.0.0
            </span>
          </h1>
          <p className="text-xs text-slate-400">Enterprise Multimodal Telemetry & Productivity Intelligence</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* MongoDB Badge */}
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-900 border border-slate-800">
          <Database className={`w-3.5 h-3.5 ${isDbConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
          <span className="text-slate-300">MongoDB:</span>
          <span className={isDbConnected ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
            {isLoading ? 'Checking...' : isDbConnected ? 'Connected' : 'In-Memory Fallback'}
          </span>
        </div>

        {/* AI Provider Badge */}
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-900 border border-slate-800">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-300">AI Model:</span>
          <span className="text-cyan-400 font-semibold">
            {health?.services?.aiProvider || 'gemini-2.5-flash'}
          </span>
        </div>

        {/* Status indicator */}
        <div className="flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Backend Live</span>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          title="Refresh Backend Health"
        >
          <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>
    </header>
  );
};
