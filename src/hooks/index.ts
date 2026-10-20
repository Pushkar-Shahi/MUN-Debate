// ============================================================
// Custom React Hooks
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api';
import type { EventFilters, SavedEvent, Source, UserPreferences } from '../types';

// --- Dashboard ---
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.fetchDashboardStats();
      return res.data;
    },
    refetchInterval: 60000,
  });
}

// --- Events ---
export function useEvents(filters: EventFilters) {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: async () => {
      const res = await api.fetchEvents(filters);
      return res;
    },
    placeholderData: (prev) => prev,
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const res = await api.fetchEvent(id);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useClosingSoon(days = 7) {
  return useQuery({
    queryKey: ['closing-soon', days],
    queryFn: async () => {
      const res = await api.fetchClosingSoon(days);
      return res.data;
    },
  });
}

export function useCalendarEvents(start: string, end: string) {
  return useQuery({
    queryKey: ['calendar-events', start, end],
    queryFn: async () => {
      const res = await api.fetchCalendarEvents(start, end);
      return res.data;
    },
    enabled: !!start && !!end,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createEvent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => api.updateEvent(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['event'] });
    },
  });
}

// --- Saved Events ---
export function useSavedEvents(status?: string, sortBy?: string) {
  return useQuery({
    queryKey: ['saved-events', status, sortBy],
    queryFn: async () => {
      const res = await api.fetchSavedEvents(status, sortBy);
      return res.data;
    },
  });
}

export function useSaveEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, status, notes }: { eventId: string; status?: string; notes?: string }) =>
      api.saveEvent(eventId, status, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saved-events'] });
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['event'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useUpdateSavedEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SavedEvent> }) =>
      api.updateSavedEvent(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saved-events'] });
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['event'] });
    },
  });
}

export function useDeleteSavedEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteSavedEvent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saved-events'] });
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

// --- Sources ---
export function useSources() {
  return useQuery({
    queryKey: ['sources'],
    queryFn: async () => {
      const res = await api.fetchSources();
      return res.data;
    },
  });
}

export function useSource(id: string) {
  return useQuery({
    queryKey: ['source', id],
    queryFn: async () => {
      const res = await api.fetchSource(id);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (source: Partial<Source>) => api.createSource(source),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sources'] });
    },
  });
}

export function useTriggerSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sourceId: string) => api.triggerSourceSync(sourceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sources'] });
      qc.invalidateQueries({ queryKey: ['sync-runs'] });
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

// --- Sync Runs ---
export function useSyncRuns(sourceId?: string) {
  return useQuery({
    queryKey: ['sync-runs', sourceId],
    queryFn: async () => {
      const res = await api.fetchSyncRuns(sourceId);
      return res.data;
    },
  });
}

// --- Preferences ---
export function usePreferences() {
  return useQuery({
    queryKey: ['preferences'],
    queryFn: async () => {
      const res = await api.fetchPreferences();
      return res.data;
    },
  });
}

export function useUpdatePreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prefs: Partial<UserPreferences>) => api.updatePreferences(prefs),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['preferences'] });
    },
  });
}

// --- Notifications ---
export function useNotifications(unread = false) {
  return useQuery({
    queryKey: ['notifications', unread],
    queryFn: async () => {
      const res = await api.fetchNotifications(unread);
      return res;
    },
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.markNotificationRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// --- Data Verification & Circuit Integrity ---
export function useVerificationSummary() {
  return useQuery({
    queryKey: ['verification-summary'],
    queryFn: async () => {
      const res = await api.fetchVerificationSummary();
      return res.data;
    },
    refetchInterval: 30000,
  });
}

export function useRunVerificationAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.runFullVerificationAudit,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['verification-summary'] });
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}
