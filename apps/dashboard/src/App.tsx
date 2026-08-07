import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { OverviewPage } from './pages/Overview';
import { SessionsPage } from './pages/Sessions';
import { EventsPage } from './pages/Events';
import { ScreenshotsPage } from './pages/Screenshots';
import { AIInsightsPage } from './pages/AIInsights';
import { AnalyticsPage } from './pages/Analytics';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-[#0B0F17] flex flex-col font-sans text-slate-100 selection:bg-cyan-500 selection:text-white">
          <Navbar />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<OverviewPage />} />
                  <Route path="/sessions" element={<SessionsPage />} />
                  <Route path="/events" element={<EventsPage />} />
                  <Route path="/screenshots" element={<ScreenshotsPage />} />
                  <Route path="/ai-insights" element={<AIInsightsPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                </Routes>
              </ErrorBoundary>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
