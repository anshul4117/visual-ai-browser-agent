import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchEvents } from '../api/client';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { MousePointerClick, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import type { EventType } from '@visual-ai/shared-types';

const EVENT_TYPES: EventType[] = [
  'session_started',
  'page_load',
  'url_change',
  'tab_switch',
  'click',
  'scroll',
  'form_interaction',
  'visibility_changed',
  'time_on_page',
];

export const EventsPage: React.FC = () => {
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('');
  const [urlSearch, setUrlSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['events-table', eventTypeFilter, urlSearch, page],
    queryFn: () =>
      fetchEvents({
        eventType: eventTypeFilter || undefined,
        url: urlSearch || undefined,
        page,
        limit,
      }),
  });

  const totalPages = data ? Math.ceil(data.total / limit) || 1 : 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Events Log</h2>
        <p className="text-xs text-slate-400">Complete, append-only browser activity telemetry log</p>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl glass-card flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by URL or title..."
              value={urlSearch}
              onChange={(e) => {
                setUrlSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={eventTypeFilter}
            onChange={(e) => {
              setEventTypeFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="">All Event Types</option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Events Table */}
      {isLoading ? (
        <LoadingSkeleton rows={8} />
      ) : !data?.data || data.data.length === 0 ? (
        <EmptyState
          title="No Events Found"
          description="Try broadening your search parameters or event type filter."
          icon={MousePointerClick}
        />
      ) : (
        <div className="p-6 rounded-2xl glass-card space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3 px-2">Type</th>
                  <th className="pb-3 px-2">Page Title / URL</th>
                  <th className="pb-3 px-2">Session ID</th>
                  <th className="pb-3 px-2">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {data.data.map((evt, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-2">
                      <Badge label={evt.eventType} variant="cyan" />
                    </td>
                    <td className="py-3 px-2 max-w-md truncate">
                      <p className="font-semibold text-slate-200 truncate">{evt.title || evt.url}</p>
                      <p className="text-[11px] text-slate-500 font-mono truncate">{evt.url}</p>
                    </td>
                    <td className="py-3 px-2 font-mono text-[11px] text-slate-400 truncate max-w-[140px]">
                      {evt.sessionId}
                    </td>
                    <td className="py-3 px-2 text-slate-400 font-mono whitespace-nowrap">
                      {new Date(evt.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-xs text-slate-400">
            <span>
              Showing Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong> ({data.total} total events)
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 disabled:opacity-40 hover:bg-slate-800 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 disabled:opacity-40 hover:bg-slate-800 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
