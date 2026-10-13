// ============================================================
// MUN & Debate Central — Root Application Component
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
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
import { useEffect, useRef } from 'react';

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

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg-primary)',
      }}>
        <div className="login-spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Clear react-query cache when user logs out so stale data isn't shown
function AuthCacheClearer() {
  const { isAuthenticated, user } = useAuth();
  const qc = useQueryClient();
  const prevUserId = useRef<string | null>(null);

  useEffect(() => {
    const currentId = user?.id ?? null;
    // If user changed (including from a user to null = logout, or from one user to another)
    if (prevUserId.current !== null && prevUserId.current !== currentId) {
      qc.clear(); // clear all cached queries so new user gets fresh data
    }
    prevUserId.current = currentId;
  }, [user?.id, qc]);

  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AuthCacheClearer />
            <Routes>
              {/* Public Route */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
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
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
