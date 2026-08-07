import React from 'react';
import type { ScreenshotWithAnalysis } from '@visual-ai/shared-types';
import { X, Calendar, Globe, Sparkles, ExternalLink, Tag } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface ScreenshotModalProps {
  screenshot: ScreenshotWithAnalysis | null;
  onClose: () => void;
}

export const ScreenshotModal: React.FC<ScreenshotModalProps> = ({ screenshot, onClose }) => {
  if (!screenshot) return null;

  const analysis = screenshot.analysis;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#131B2E] border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-3 truncate">
            <Globe className="w-5 h-5 text-cyan-400 shrink-0" />
            <div className="truncate">
              <h3 className="text-sm font-bold text-white truncate">{screenshot.title || screenshot.url}</h3>
              <p className="text-xs text-slate-400 truncate">{screenshot.url}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Image preview container */}
          <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center max-h-[450px]">
            <img
              src={screenshot.filePath}
              alt={screenshot.title}
              className="max-h-[450px] w-auto object-contain"
              onError={(e) => {
                // Fallback image if local backend file path fails
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1280&auto=format&fit=crop';
              }}
            />
          </div>

          {/* AI Insights Block if present */}
          {analysis ? (
            <div className="p-5 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Vision Intelligence ({analysis.model})</span>
                </div>
                <Badge label={analysis.category} variant="cyan" />
              </div>

              <p className="text-sm text-slate-200 leading-relaxed font-medium">{analysis.summary}</p>

              {/* Productivity Score Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Productivity Score</span>
                  <span className="text-cyan-400">{analysis.productivityScore} / 100</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${analysis.productivityScore}%` }}
                  />
                </div>
              </div>

              {/* Entities */}
              {analysis.entities && analysis.entities.length > 0 && (
                <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                  <Tag className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  {analysis.entities.map((tag, i) => (
                    <span key={i} className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400 text-center">
              AI Vision analysis pending or processing in background queue.
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Captured: {new Date(screenshot.capturedAt).toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-2 truncate">
              <ExternalLink className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="truncate">Session: {screenshot.sessionId}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
