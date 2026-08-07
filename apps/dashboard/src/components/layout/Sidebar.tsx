import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Clock,
  MousePointerClick,
  Image,
  Sparkles,
  BarChart3,
  ExternalLink,
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/sessions', label: 'Sessions', icon: Clock },
  { path: '/events', label: 'Events Log', icon: MousePointerClick },
  { path: '/screenshots', label: 'Visual Captures', icon: Image },
  { path: '/ai-insights', label: 'AI Vision Insights', icon: Sparkles },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-[#0B0F17] border-r border-slate-800/80 p-4 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Navigation Menu
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-lg shadow-cyan-500/5'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center space-x-2 text-xs font-medium text-cyan-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Chrome Extension</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Manifest V3 Chrome Extension is capturing real-time browser activity.
        </p>
        <a
          href="http://localhost:3000/api/health"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white font-medium transition"
        >
          <span>Check Server API Health</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </aside>
  );
};
