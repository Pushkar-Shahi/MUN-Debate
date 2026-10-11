// ============================================================
// MUN & Debate Central — Root Application Component
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { EventsPage } from './pages/EventsPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { ClosingSoonPage } from './pages/ClosingSoonPage';
import { CalendarPage } from './pages/CalendarPage';
import { SavedEventsPage } from './pages/SavedEventsPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { CompletedPage } from './pages/CompletedPage';
import { SourcesPage } from './pages/SourcesPage';
import { SettingsPage } from './pages/SettingsPage';

// Configure QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/closing-soon" element={<ClosingSoonPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/saved" element={<SavedEventsPage />} />
            <Route path="/applications" element={<ApplicationsPage />} />
            <Route path="/completed" element={<CompletedPage />} />
            <Route path="/sources" element={<SourcesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
