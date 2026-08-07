import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSessions, fetchEvents } from '../api/client';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { Clock, MousePointerClick, ChevronRight, Activity } from 'lucide-react';

function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return '< 1s';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

export const SessionsPage: React.FC = () => {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: fetchSessions,
    refetchInterval: 10000,
  });

  const { data: sessionEvents, isLoading: isEventsLoading } = useQuery({
    queryKey: ['session-events', selectedSessionId],
    queryFn: () => fetchEvents({ sessionId: selectedSessionId || '', limit: 100 }),
    enabled: !!selectedSessionId,
  });

  if (isLoading) return <LoadingSkeleton rows={6} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Browsing Sessions</h2>
        <p className="text-xs text-slate-400">Tracked user session lifecycles, duration, and event counts</p>
      </div>

      {!sessions || sessions.length === 0 ? (
        <EmptyState
          title="No Sessions Recorded Yet"
          description="Sessions will automatically appear here as the Chrome Extension records activity."
          icon={Clock}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sessions List */}
          <div className="lg:col-span-1 space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
              Active & Past Sessions ({sessions.length})
            </div>
            <div className="space-y-2 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
              {sessions.map((sess) => {
                const isSelected = selectedSessionId === sess.sessionId;
                return (
                  <div
                    key={sess.sessionId}
                    onClick={() => setSelectedSessionId(sess.sessionId)}
                    className={`p-4 rounded-xl cursor-pointer transition border ${
                      isSelected
                        ? 'bg-cyan-500/10 border-cyan-500/30 shadow-lg shadow-cyan-500/5'
                        : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-cyan-400 font-semibold truncate max-w-[160px]">
                        {sess.sessionId}
                      </span>
                      <Badge
                        label={sess.endedAt ? 'Ended' : 'Active'}
                        variant={sess.endedAt ? 'slate' : 'emerald'}
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{formatDuration(sess.duration)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MousePointerClick className="w-3.5 h-3.5 text-slate-500" />
                        <span>{sess.eventCount || 0} events</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition ${isSelected ? 'text-cyan-400 transform translate-x-1' : 'text-slate-600'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Session Timeline Details */}
          <div className="lg:col-span-2 p-6 rounded-2xl glass-card space-y-4">
            {selectedSessionId ? (
              <>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      <span>Session Timeline Details</span>
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedSessionId}</p>
                  </div>
                  {sessionEvents && (
                    <Badge label={`${sessionEvents.total} Events in Session`} variant="cyan" />
                  )}
                </div>

                {isEventsLoading ? (
                  <LoadingSkeleton rows={4} />
                ) : !sessionEvents?.data || sessionEvents.data.length === 0 ? (
                  <EmptyState
                    title="No Events Captured for this Session"
                    description="Select another session from the list."
                  />
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {sessionEvents.data.map((evt, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <Badge label={evt.eventType} variant="indigo" />
                          <span className="text-slate-500 font-mono">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-200 truncate">{evt.title || evt.url}</p>
                        <p className="text-[11px] text-slate-400 font-mono truncate">{evt.url}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                title="Select a Session to View Timeline"
                description="Click on any session card on the left to view its detailed event timeline."
                icon={Activity}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
