import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchScreenshots } from '../api/client';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { ScreenshotModal } from '../components/modals/ScreenshotModal';
import { Image as ImageIcon, Sparkles, Maximize2, Calendar } from 'lucide-react';
import type { ScreenshotWithAnalysis } from '@visual-ai/shared-types';

export const ScreenshotsPage: React.FC = () => {
  const [selectedScreenshot, setSelectedScreenshot] = useState<ScreenshotWithAnalysis | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['screenshots-gallery'],
    queryFn: () => fetchScreenshots({ limit: 30 }),
    refetchInterval: 15000,
  });

  if (isLoading) return <LoadingSkeleton rows={6} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Visual Context Gallery</h2>
        <p className="text-xs text-slate-400">Captured browser tab screenshots and paired AI vision analysis</p>
      </div>

      {!data?.data || data.data.length === 0 ? (
        <EmptyState
          title="No Visual Context Captures Recorded"
          description="The Chrome Extension periodically captures tab screenshots every 30 seconds."
          icon={ImageIcon}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.data.map((scr) => {
            const analysis = scr.analysis;
            return (
              <div
                key={scr.screenshotId}
                onClick={() => setSelectedScreenshot(scr)}
                className="group relative rounded-2xl glass-card glass-card-hover overflow-hidden border cursor-pointer flex flex-col"
              >
                {/* Thumbnail image container */}
                <div className="h-44 w-full bg-slate-950 overflow-hidden relative border-b border-slate-800/80">
                  <img
                    src={scr.filePath}
                    alt={scr.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1280&auto=format&fit=crop';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span className="p-2.5 rounded-full bg-cyan-500 text-white shadow-lg">
                      <Maximize2 className="w-5 h-5" />
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white truncate">{scr.title || scr.url}</h4>
                    <p className="text-[11px] text-slate-400 truncate">{scr.url}</p>
                  </div>

                  {analysis ? (
                    <div className="p-2.5 rounded-xl bg-cyan-500/5 border border-cyan-500/15 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1">
                          <Sparkles className="w-3 h-3" />
                          <span>AI Summary</span>
                        </span>
                        <Badge label={analysis.category} variant="cyan" />
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2">{analysis.summary}</p>
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-500 text-center">
                      AI Analysis queued...
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{new Date(scr.capturedAt).toLocaleTimeString()}</span>
                    </span>
                    <span className="font-mono text-cyan-400">Score: {analysis?.productivityScore || '--'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      <ScreenshotModal
        screenshot={selectedScreenshot}
        onClose={() => setSelectedScreenshot(null)}
      />
    </div>
  );
};
