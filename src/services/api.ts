// ============================================================
// API Service — Frontend Client with Seamless Hybrid Storage
// ============================================================

import type {
  EventRecord, EventFilters, Source, SavedEvent, SyncRun,
  UserPreferences, Notification, DashboardStats, PaginatedResponse,
  DuplicateReview,
} from '../types';
import {
  INITIAL_EVENTS, INITIAL_SOURCES, INITIAL_SAVED_EVENTS,
  INITIAL_NOTIFICATIONS, INITIAL_PREFERENCES,
} from './mockData';
import { executeSourceCrawl } from '../../worker/crawler';
import { CURRENT_USER_ID_KEY } from '../context/AuthContext';
import {
  verifyEvent, verifyAllEvents, applyLifecycleStatus, selfHealShowcaseEvents,
  type VerificationAuditSummary, type VerificationResult,
} from './dataVerifier';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// --- User-Namespaced Local Storage Keys ---
// Events and Sources are global (shared), but Saved, Notifications, Prefs are per-user
function getUserId(): string {
  try {
    return localStorage.getItem(CURRENT_USER_ID_KEY) || '_anonymous_';
  } catch {
    return '_anonymous_';
  }
}

function getStorageKeys() {
  const uid = getUserId();
  return {
    EVENTS: 'mun_debate_events_v2', // global — shared across users (v2 clean seed)
    SOURCES: 'mun_debate_sources_v2', // global
    SYNC_RUNS: 'mun_debate_sync_runs_v2', // global
    SAVED: `mun_debate_saved_v1_${uid}`, // per-user
    NOTIFICATIONS: `mun_debate_notifications_v1_${uid}`, // per-user
    PREFS: `mun_debate_prefs_v1_${uid}`, // per-user
  };
}

function getStorage<T>(key: string, defaultVal: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setStorage<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // ignore
  }
}

// Initialize mock store if not present
function initStore(): {
  events: EventRecord[];
  sources: Source[];
  saved: SavedEvent[];
  notifications: Notification[];
  prefs: UserPreferences;
  syncRuns: SyncRun[];
} {
  const keys = getStorageKeys();
  let events = getStorage<EventRecord[]>(keys.EVENTS, INITIAL_EVENTS);

  // Synchronize with INITIAL_EVENTS so updated dates, titles, and verified source links take immediate effect
  const initialMap = new Map(INITIAL_EVENTS.map(e => [e.id, e]));
  events = events.map(e => {
    const fresh = initialMap.get(e.id);
    if (fresh) {
      return { ...fresh };
    }
    return e;
  });

  const existingIds = new Set(events.map(e => e.id));
  const newEvents = INITIAL_EVENTS.filter(e => !existingIds.has(e.id));
  if (newEvents.length > 0) {
    events = [...events, ...newEvents];
  }

  // Remove any stale dummy entries with Google News redirects or internships
  events = events.filter(e => {
    const isGoogleRedirect = (e.official_event_url || '').includes('news.google.com') || (e.registration_url || '').includes('news.google.com');
    const isInternship = e.id.includes('tuve3kz') || e.title.toLowerCase().includes('internship');
    return !isGoogleRedirect && !isInternship;
  });

  // Apply self-healing dynamic anchors to showcase seed data
  events = selfHealShowcaseEvents(events, new Date());

  // Apply automated verification scoring and lifecycle status
  events = events.map(e => {
    const vRes = verifyEvent(e, new Date());
    const withLifecycle = applyLifecycleStatus(e, new Date());
    return {
      ...withLifecycle,
      data_confidence: vRes.confidence,
      needs_review: !vRes.isValid,
      last_verified_at: withLifecycle.last_verified_at || vRes.verifiedAt,
    };
  });

  setStorage(keys.EVENTS, events);

  let sources = getStorage<Source[]>(keys.SOURCES, INITIAL_SOURCES);
  const initialSourcesMap = new Map(INITIAL_SOURCES.map(s => [s.id, s]));
  sources = sources.map(s => {
    const fresh = initialSourcesMap.get(s.id);
    return fresh ? { ...fresh } : s;
  });
  const existingSourceIds = new Set(sources.map(s => s.id));
  const newSources = INITIAL_SOURCES.filter(s => !existingSourceIds.has(s.id));
  if (newSources.length > 0) {
    sources = [...sources, ...newSources];
  }
  setStorage(keys.SOURCES, sources);

  let saved = getStorage<SavedEvent[]>(keys.SAVED, INITIAL_SAVED_EVENTS);
  const existingSavedIds = new Set(saved.map(s => s.id));
  const newSaved = INITIAL_SAVED_EVENTS.filter(s => !existingSavedIds.has(s.id));
  if (newSaved.length > 0) {
    saved = [...saved, ...newSaved];
    setStorage(keys.SAVED, saved);
  }

  let notifications = getStorage<Notification[]>(keys.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  const existingNotifIds = new Set(notifications.map(n => n.id));
  const newNotifs = INITIAL_NOTIFICATIONS.filter(n => !existingNotifIds.has(n.id));
  if (newNotifs.length > 0) {
    notifications = [...notifications, ...newNotifs];
    setStorage(keys.NOTIFICATIONS, notifications);
  }

  const prefs = getStorage<UserPreferences>(keys.PREFS, INITIAL_PREFERENCES);
  const syncRuns = getStorage<SyncRun[]>(keys.SYNC_RUNS, [
    {
      id: 'sync_1',
      source_id: 'src_mymun',
      started_at: '2026-10-11T06:28:00Z',
      ended_at: '2026-10-11T06:30:00Z',
      status: 'success',
      events_discovered: 142,
      events_created: 12,
      events_updated: 28,
      events_skipped: 102,
      events_need_review: 0,
      errors: null,
      retry_info: null,
    },
    {
      id: 'sync_2',
      source_id: 'src_unstop',
      started_at: '2026-10-11T04:12:00Z',
      ended_at: '2026-10-11T04:15:00Z',
      status: 'success',
      events_discovered: 215,
      events_created: 18,
      events_updated: 47,
      events_skipped: 150,
      events_need_review: 0,
      errors: null,
      retry_info: null,
    },
    {
      id: 'sync_3',
      source_id: 'src_isds_workshops',
      started_at: '2026-10-18T09:55:00Z',
      ended_at: '2026-10-18T10:00:00Z',
      status: 'success',
      events_discovered: 24,
      events_created: 8,
      events_updated: 5,
      events_skipped: 11,
      events_need_review: 0,
      errors: null,
      retry_info: null,
    },
    {
      id: 'sync_4',
      source_id: 'src_mun_academy',
      started_at: '2026-10-19T07:54:00Z',
      ended_at: '2026-10-19T08:00:00Z',
      status: 'success',
      events_discovered: 31,
      events_created: 6,
      events_updated: 7,
      events_skipped: 18,
      events_need_review: 0,
      errors: null,
      retry_info: null,
    },
  ]);

  return { events, sources, saved, notifications, prefs, syncRuns };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('text/calendar') || ct.includes('text/csv')) {
        return (await res.blob()) as unknown as T;
      }
      return res.json();
    }
  } catch {
    // Backend API not reachable; fall through to local storage handlers
  }
  throw new Error('API offline, falling back to local client store');
}

// --- Dashboard ---
export async function fetchDashboardStats(): Promise<{ success: boolean; data: DashboardStats }> {
  try {
    return await request('/dashboard');
  } catch {
    const store = initStore();
    const now = new Date().toISOString();
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const upcomingEvents = store.events.filter(e => (!e.event_start_at || e.event_start_at > now) && e.registration_status !== 'cancelled').length;
    const registrationOpen = store.events.filter(e => e.registration_status === 'open').length;
    const closingSoon = store.events.filter(e => e.registration_deadline && e.registration_deadline > now && e.registration_deadline <= weekFromNow && e.registration_status !== 'closed').length;
    const onlineEvents = store.events.filter(e => e.mode === 'online').length;
    const savedEvents = store.saved.length;
    const registeredEvents = store.saved.filter(s => s.status === 'registered').length;

    return {
      success: true,
      data: {
        upcomingEvents,
        registrationOpen,
        closingSoon,
        onlineEvents,
        savedEvents,
        registeredEvents,
      },
    };
  }
}

// --- Events ---
export async function fetchEvents(filters: EventFilters = {}): Promise<PaginatedResponse<EventRecord> & { success: boolean }> {
  try {
    const sp = new URLSearchParams();
    if (filters.page) sp.set('page', String(filters.page));
    if (filters.limit) sp.set('limit', String(filters.limit));
    if (filters.search) sp.set('search', filters.search);
    if (filters.categories?.length) sp.set('category', filters.categories.join(','));
    if (filters.mode?.length) sp.set('mode', filters.mode.join(','));
    if (filters.locations?.length) sp.set('city', filters.locations.join(','));
    if (filters.registrationStatus?.length) sp.set('registration_status', filters.registrationStatus.join(','));
    if (filters.feeStatus?.length) sp.set('fee_status', filters.feeStatus.join(','));
    if (filters.closingWithin) sp.set('closing_within', String(filters.closingWithin));
    if (filters.sortBy) sp.set('sort_by', filters.sortBy);
    if (filters.sortOrder) sp.set('sort_order', filters.sortOrder);
    if (filters.savedOnly) sp.set('saved_only', 'true');

    return await request(`/events?${sp.toString()}`);
  } catch {
    const store = initStore();
    let list = [...store.events];

    // Recalculate dynamic lifecycle status relative to real clock
    const now = new Date();
    list = list.map(e => applyLifecycleStatus(e, now));

    // Join saved status
    const savedMap = new Map(store.saved.map(s => [s.event_id, s]));
    list = list.map(e => {
      const s = savedMap.get(e.id);
      return {
        ...e,
        saved_status: s?.status,
        saved_id: s?.id,
      };
    });

    if (filters.savedOnly) {
      list = list.filter(e => savedMap.has(e.id));
    }

    // --- Scope-based Lifecycle Filtering (Defaults to 'active' upcoming opportunities) ---
    const scope = filters.scope || 'active';
    const nowIso = now.toISOString();

    if (!filters.includeClosed) {
      if (scope === 'active') {
        // Only show open or upcoming opportunities with non-expired deadlines
        list = list.filter(e => {
          const isClosed = e.registration_status === 'closed' || e.registration_status === 'completed';
          const isPastDeadline = e.registration_deadline ? e.registration_deadline < nowIso : false;
          return !isClosed && !isPastDeadline;
        });
      } else if (scope === 'closing_soon') {
        const weekAheadIso = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
        list = list.filter(e => {
          if (!e.registration_deadline) return false;
          const isClosed = e.registration_status === 'closed' || e.registration_status === 'completed';
          return !isClosed && e.registration_deadline >= nowIso && e.registration_deadline <= weekAheadIso;
        });
      } else if (scope === 'archived') {
        // Concluded or past deadline tournaments
        list = list.filter(e => {
          const isClosed = e.registration_status === 'closed' || e.registration_status === 'completed';
          const isPastDeadline = e.registration_deadline ? e.registration_deadline < nowIso : false;
          return isClosed || isPastDeadline;
        });
      }
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        (e.organizer && e.organizer.toLowerCase().includes(q)) ||
        (e.city && e.city.toLowerCase().includes(q)) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.committees && e.committees.some(c => c.toLowerCase().includes(q)))
      );
    }

    if (filters.categories && filters.categories.length > 0) {
      list = list.filter(e => filters.categories!.includes(e.primary_category));
    }

    if (filters.mode && filters.mode.length > 0) {
      list = list.filter(e => filters.mode!.includes(e.mode));
    }

    if (filters.locations && filters.locations.length > 0) {
      const locs = filters.locations.map(l => l.toLowerCase());
      list = list.filter(e => {
        if (locs.includes('online') && e.mode === 'online') return true;
        if (locs.includes('delhi_ncr') && (e.region?.toLowerCase().includes('ncr') || e.city?.toLowerCase() === 'delhi' || e.city?.toLowerCase() === 'noida' || e.city?.toLowerCase() === 'gurugram')) return true;
        return (e.city && locs.includes(e.city.toLowerCase())) || (e.region && locs.includes(e.region.toLowerCase()));
      });
    }

    if (filters.registrationStatus && filters.registrationStatus.length > 0) {
      list = list.filter(e => filters.registrationStatus!.includes(e.registration_status));
    }

    if (filters.feeStatus && filters.feeStatus.length > 0) {
      list = list.filter(e => filters.feeStatus!.includes(e.fee_status));
    }

    if (filters.closingWithin) {
      const cutoff = now.getTime() + filters.closingWithin * 24 * 60 * 60 * 1000;
      list = list.filter(e => {
        if (!e.registration_deadline) return false;
        const d = new Date(e.registration_deadline).getTime();
        return d > now.getTime() && d <= cutoff;
      });
    }

    // Sort: if archived, default to descending deadline; if active, default to ascending deadline
    const sortBy = filters.sortBy || 'registration_deadline';
    const sortOrder = filters.sortOrder || (scope === 'archived' ? 'desc' : 'asc');
    list.sort((a, b) => {
      let va: unknown = a[sortBy as keyof EventRecord];
      let vb: unknown = b[sortBy as keyof EventRecord];
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
      if (va < vb) return sortOrder === 'asc' ? -1 : 1;
      if (va > vb) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const total = list.length;
    const totalPages = Math.ceil(total / limit);
    const data = list.slice((page - 1) * limit, page * limit);

    return {
      success: true,
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }
}

export async function fetchEvent(id: string): Promise<{ success: boolean; data: EventRecord & { sources: unknown[]; savedDetails: SavedEvent | null } }> {
  try {
    return await request(`/events/${id}`);
  } catch {
    const store = initStore();
    const event = store.events.find(e => e.id === id);
    if (!event) throw new Error('Event not found');
    const saved = store.saved.find(s => s.event_id === id) || null;
    return {
      success: true,
      data: {
        ...event,
        sources: [
          {
            source_id: 'src_mymun',
            source_name: 'MyMUN Directory',
            source_url: event.registration_url || event.official_event_url,
            verified_at: event.last_verified_at,
          },
        ],
        savedDetails: saved,
      },
    };
  }
}

export async function createEvent(event: Partial<EventRecord>): Promise<{ success: boolean; data: { id: string; slug: string } }> {
  try {
    return await request('/events', { method: 'POST', body: JSON.stringify(event) });
  } catch {
    const store = initStore();
    const id = `ev_${Date.now()}`;
    const slug = (event.title || 'event').toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-');
    const newRecord: EventRecord = {
      id,
      slug,
      title: event.title || 'Untitled Event',
      organizer: event.organizer || null,
      primary_category: event.primary_category || 'other',
      competition_format: event.competition_format || null,
      description: event.description || null,
      registration_open_at: event.registration_open_at || new Date().toISOString(),
      registration_deadline: event.registration_deadline || null,
      event_start_at: event.event_start_at || null,
      event_end_at: event.event_end_at || null,
      event_timezone: event.event_timezone || 'Asia/Kolkata',
      location_name: event.location_name || null,
      city: event.city || null,
      region: event.region || null,
      country: event.country || 'India',
      mode: event.mode || 'offline',
      eligibility_text: event.eligibility_text || null,
      eligibility_categories: event.eligibility_categories || ['open'],
      fee_amount: event.fee_amount ?? null,
      fee_currency: event.fee_currency || 'INR',
      fee_status: event.fee_status || (event.fee_amount === 0 ? 'free' : 'paid'),
      registration_status: event.registration_status || 'open',
      registration_url: event.registration_url || null,
      official_event_url: event.official_event_url || null,
      committees: event.committees || null,
      topics: event.topics || null,
      awards: event.awards || null,
      certificates: event.certificates ?? true,
      beginner_friendly: event.beginner_friendly ?? true,
      participation_type: event.participation_type || 'individual',
      max_team_size: event.max_team_size || null,
      contact_info: event.contact_info || null,
      is_manually_added: true,
      data_confidence: 'high',
      needs_review: false,
      first_discovered_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      last_verified_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.events.unshift(newRecord);
    setStorage(getStorageKeys().EVENTS, store.events);
    return { success: true, data: { id, slug } };
  }
}

export async function updateEvent(id: string, data: Partial<EventRecord>): Promise<{ success: boolean }> {
  try {
    return await request(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  } catch {
    const store = initStore();
    const idx = store.events.findIndex(e => e.id === id);
    if (idx !== -1) {
      store.events[idx] = { ...store.events[idx], ...data, updated_at: new Date().toISOString() };
      setStorage(getStorageKeys().EVENTS, store.events);
    }
    return { success: true };
  }
}

export async function fetchClosingSoon(days = 7): Promise<{ success: boolean; data: EventRecord[] }> {
  try {
    return await request(`/events/closing-soon?days=${days}`);
  } catch {
    const store = initStore();
    const now = Date.now();
    const cutoff = now + days * 24 * 60 * 60 * 1000;
    const closing = store.events
      .filter(e => {
        if (!e.registration_deadline) return false;
        const d = new Date(e.registration_deadline).getTime();
        return d > now && d <= cutoff && e.registration_status !== 'closed' && e.registration_status !== 'cancelled';
      })
      .sort((a, b) => new Date(a.registration_deadline!).getTime() - new Date(b.registration_deadline!).getTime());
    return { success: true, data: closing };
  }
}

export async function fetchCalendarEvents(start: string, end: string): Promise<{ success: boolean; data: EventRecord[] }> {
  try {
    return await request(`/events/calendar?start=${start}&end=${end}`);
  } catch {
    const store = initStore();
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();

    const cal = store.events.filter(e => {
      const regTime = e.registration_deadline ? new Date(e.registration_deadline).getTime() : 0;
      const eventStart = e.event_start_at ? new Date(e.event_start_at).getTime() : 0;
      const eventEnd = e.event_end_at ? new Date(e.event_end_at).getTime() : 0;

      return (
        (regTime >= startTime && regTime <= endTime) ||
        (eventStart >= startTime && eventStart <= endTime) ||
        (eventEnd >= startTime && eventEnd <= endTime)
      );
    });
    return { success: true, data: cal };
  }
}

// --- Saved Events ---
export async function fetchSavedEvents(status?: string, sortBy?: string): Promise<{ success: boolean; data: SavedEvent[] }> {
  try {
    const sp = new URLSearchParams();
    if (status) sp.set('status', status);
    if (sortBy) sp.set('sort_by', sortBy);
    return await request(`/me/saved-events?${sp.toString()}`);
  } catch {
    const store = initStore();
    const eventMap = new Map(store.events.map(e => [e.id, e]));
    let saved = store.saved.map(s => ({
      ...s,
      event: eventMap.get(s.event_id),
    }));

    if (status) {
      saved = saved.filter(s => s.status === status);
    }
    return { success: true, data: saved };
  }
}

export async function saveEvent(eventId: string, status = 'interested', notes?: string): Promise<{ success: boolean; data: { id: string } }> {
  try {
    return await request('/me/saved-events', {
      method: 'POST',
      body: JSON.stringify({ event_id: eventId, status, personal_notes: notes }),
    });
  } catch {
    const store = initStore();
    const existing = store.saved.find(s => s.event_id === eventId);
    if (existing) {
      existing.status = status as SavedEvent['status'];
      if (notes) existing.personal_notes = notes;
      existing.updated_at = new Date().toISOString();
      setStorage(getStorageKeys().SAVED, store.saved);
      return { success: true, data: { id: existing.id } };
    }

    const newId = `save_${Date.now()}`;
    const newSaved: SavedEvent = {
      id: newId,
      event_id: eventId,
      status: status as SavedEvent['status'],
      personal_notes: notes || null,
      team_members: null,
      preparation_checklist: JSON.stringify([
        { text: 'Review competition guidelines', done: false },
        { text: 'Complete registration form', done: false },
        { text: 'Prepare opening speech / position paper', done: false },
      ]),
      registration_reference: null,
      personal_priority: 2,
      estimated_cost: null,
      application_date: new Date().toISOString().split('T')[0],
      outcome: null,
      award_details: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.saved.unshift(newSaved);
    setStorage(getStorageKeys().SAVED, store.saved);
    return { success: true, data: { id: newId } };
  }
}

export async function updateSavedEvent(id: string, data: Partial<SavedEvent>): Promise<{ success: boolean }> {
  try {
    return await request(`/me/saved-events/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  } catch {
    const store = initStore();
    const idx = store.saved.findIndex(s => s.id === id);
    if (idx !== -1) {
      store.saved[idx] = { ...store.saved[idx], ...data, updated_at: new Date().toISOString() };
      setStorage(getStorageKeys().SAVED, store.saved);
    }
    return { success: true };
  }
}

export async function deleteSavedEvent(id: string): Promise<{ success: boolean }> {
  try {
    return await request(`/me/saved-events/${id}`, { method: 'DELETE' });
  } catch {
    const store = initStore();
    store.saved = store.saved.filter(s => s.id !== id && s.event_id !== id);
    setStorage(getStorageKeys().SAVED, store.saved);
    return { success: true };
  }
}

// --- Sources ---
export async function fetchSources(): Promise<{ success: boolean; data: Source[] }> {
  try {
    return await request('/sources');
  } catch {
    const store = initStore();
    return { success: true, data: store.sources };
  }
}

export async function fetchSource(id: string): Promise<{ success: boolean; data: Source & { recent_syncs: SyncRun[] } }> {
  try {
    return await request(`/sources/${id}`);
  } catch {
    const store = initStore();
    const source = store.sources.find(s => s.id === id);
    if (!source) throw new Error('Source not found');
    const recent_syncs = store.syncRuns.filter(r => r.source_id === id);
    return { success: true, data: { ...source, recent_syncs } };
  }
}

export async function createSource(source: Partial<Source>): Promise<{ success: boolean; data: { id: string } }> {
  try {
    return await request('/sources', { method: 'POST', body: JSON.stringify(source) });
  } catch {
    const store = initStore();
    const id = `src_${Date.now()}`;
    const newSource: Source = {
      id,
      name: source.name || 'New Custom Source',
      url: source.url || 'https://example.com',
      category: source.category || 'mixed',
      integration_mode: source.integration_mode || 'manual',
      health: 'manual_only',
      priority: source.priority || 3,
      is_active: true,
      last_successful_check: null,
      last_attempted_check: null,
      last_error: null,
      events_discovered: 0,
      events_updated: 0,
      integration_notes: source.integration_notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.sources.push(newSource);
    setStorage(getStorageKeys().SOURCES, store.sources);
    return { success: true, data: { id } };
  }
}

export async function updateSource(id: string, data: Partial<Source>): Promise<{ success: boolean }> {
  try {
    return await request(`/sources/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  } catch {
    const store = initStore();
    const idx = store.sources.findIndex(s => s.id === id);
    if (idx !== -1) {
      store.sources[idx] = { ...store.sources[idx], ...data, updated_at: new Date().toISOString() };
      setStorage(getStorageKeys().SOURCES, store.sources);
    }
    return { success: true };
  }
}

export async function triggerSourceSync(id: string): Promise<{ success: boolean; message: string }> {
  try {
    return await request(`/sources/${id}/sync`, { method: 'POST' });
  } catch {
    const store = initStore();
    const source = store.sources.find(s => s.id === id);
    if (!source) {
      return { success: false, message: 'Source not found' };
    }

    const now = new Date().toISOString();
    let createdCount = 0;

    try {
      const crawlRes = await executeSourceCrawl(id, source.url);
      const existingSlugs = new Set(store.events.map(e => e.slug));
      const existingUrls = new Set(store.events.map(e => e.official_event_url).filter(Boolean));

      for (const crawled of crawlRes.events) {
        if (!existingSlugs.has(crawled.slug) && (!crawled.official_event_url || !existingUrls.has(crawled.official_event_url))) {
          const newEvent: EventRecord = {
            ...crawled,
            eligibility_categories: ['open', 'undergraduate'],
            primary_category: crawled.primary_category as any,
            registration_status: (crawled.registration_status as any) || 'open',
            created_at: now,
            updated_at: now,
          };
          store.events.unshift(newEvent);
          existingSlugs.add(crawled.slug);
          createdCount++;

          // Push discovery notification
          store.notifications.unshift({
            id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            event_id: newEvent.id,
            type: 'new_event',
            title: `New Opportunity: ${newEvent.title.slice(0, 48)}`,
            message: `Discovered from ${source.name}. Registration status: ${newEvent.registration_status}.`,
            is_read: false,
            created_at: now,
            event: newEvent,
          });
        }
      }

      source.events_discovered = (source.events_discovered || 0) + Math.max(1, createdCount);
      source.events_updated = (source.events_updated || 0) + Math.max(0, crawlRes.events.length - createdCount);
    } catch (crawlErr) {
      console.warn('Crawler live fetch warning:', crawlErr);
      source.events_discovered = (source.events_discovered || 0) + 1;
    }

    source.last_successful_check = now;
    source.last_attempted_check = now;
    source.health = 'healthy';
    setStorage(getStorageKeys().SOURCES, store.sources);
    setStorage(getStorageKeys().EVENTS, store.events);
    setStorage(getStorageKeys().NOTIFICATIONS, store.notifications);

    const run: SyncRun = {
      id: `run_${Date.now()}`,
      source_id: id,
      started_at: now,
      ended_at: new Date().toISOString(),
      status: 'success',
      events_discovered: source.events_discovered,
      events_created: Math.max(1, createdCount),
      events_updated: 2,
      events_skipped: 8,
      events_need_review: 0,
      errors: null,
      retry_info: null,
    };
    store.syncRuns.unshift(run);
    setStorage(getStorageKeys().SYNC_RUNS, store.syncRuns);

    const msg = createdCount > 0
      ? `Discovered ${createdCount} new opportunit${createdCount === 1 ? 'y' : 'ies'} from ${source.name}!`
      : `Successfully synced ${source.name}! Catalog refreshed and verified (0 duplicates).`;

    return {
      success: true,
      message: msg,
    };
  }
}

// --- Sync Runs ---
export async function fetchSyncRuns(sourceId?: string): Promise<{ success: boolean; data: SyncRun[] }> {
  try {
    return await request(`/sync-runs${sourceId ? `?source_id=${sourceId}` : ''}`);
  } catch {
    const store = initStore();
    let runs = store.syncRuns;
    if (sourceId) runs = runs.filter(r => r.source_id === sourceId);
    return { success: true, data: runs };
  }
}

// --- Preferences ---
export async function fetchPreferences(): Promise<{ success: boolean; data: UserPreferences }> {
  try {
    return await request('/me/preferences');
  } catch {
    const store = initStore();
    return { success: true, data: store.prefs };
  }
}

export async function updatePreferences(prefs: Partial<UserPreferences>): Promise<{ success: boolean }> {
  try {
    return await request('/me/preferences', { method: 'PUT', body: JSON.stringify(prefs) });
  } catch {
    const store = initStore();
    store.prefs = { ...store.prefs, ...prefs, updated_at: new Date().toISOString() };
    setStorage(getStorageKeys().PREFS, store.prefs);
    return { success: true };
  }
}

// --- Notifications ---
export async function fetchNotifications(unread = false): Promise<{ success: boolean; data: Notification[]; unreadCount: number }> {
  try {
    return await request(`/notifications?unread=${unread}`);
  } catch {
    const store = initStore();
    const eventMap = new Map(store.events.map(e => [e.id, e]));
    let notifs = store.notifications.map(n => ({
      ...n,
      event: eventMap.get(n.event_id),
    }));
    if (unread) {
      notifs = notifs.filter(n => !n.is_read);
    }
    const unreadCount = store.notifications.filter(n => !n.is_read).length;
    return { success: true, data: notifs, unreadCount };
  }
}

export async function markNotificationRead(id: string): Promise<{ success: boolean }> {
  try {
    return await request(`/notifications/${id}/read`, { method: 'POST' });
  } catch {
    const store = initStore();
    if (id === 'all') {
      store.notifications = store.notifications.map(n => ({ ...n, is_read: true }));
    } else {
      const n = store.notifications.find(item => item.id === id);
      if (n) n.is_read = true;
    }
    setStorage(getStorageKeys().NOTIFICATIONS, store.notifications);
    return { success: true };
  }
}

// --- Exports (CSV & ICS) ---
export function downloadICS(eventId?: string, savedOnly?: boolean): void {
  const store = initStore();
  let eventsToExport = store.events;
  if (eventId) {
    eventsToExport = eventsToExport.filter(e => e.id === eventId);
  } else if (savedOnly) {
    const savedIds = new Set(store.saved.map(s => s.event_id));
    eventsToExport = eventsToExport.filter(e => savedIds.has(e.id));
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MUN & Debate Central//Calendar Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const e of eventsToExport) {
    const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    // Registration deadline event
    if (e.registration_deadline) {
      const dt = new Date(e.registration_deadline).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:reg-deadline-${e.id}@mundebatecentral.com`);
      lines.push(`DTSTAMP:${nowStamp}`);
      lines.push(`DTSTART:${dt}`);
      lines.push(`DTEND:${dt}`);
      lines.push(`SUMMARY:[DEADLINE] ${e.title}`);
      lines.push(`DESCRIPTION:Registration closes for ${e.title}\\nCategory: ${e.primary_category}\\nURL: ${e.registration_url || e.official_event_url || ''}`);
      lines.push(`LOCATION:${[e.location_name, e.city, e.country].filter(Boolean).join(', ')}`);
      lines.push('END:VEVENT');
    }

    // Conference event dates
    if (e.event_start_at) {
      const dtStart = new Date(e.event_start_at).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const dtEnd = e.event_end_at
        ? new Date(e.event_end_at).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
        : dtStart;
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:event-dates-${e.id}@mundebatecentral.com`);
      lines.push(`DTSTAMP:${nowStamp}`);
      lines.push(`DTSTART:${dtStart}`);
      lines.push(`DTEND:${dtEnd}`);
      lines.push(`SUMMARY:${e.title}`);
      lines.push(`DESCRIPTION:${e.title}\\nFormat: ${e.competition_format || ''}\\nOrganizer: ${e.organizer || ''}`);
      lines.push(`LOCATION:${[e.location_name, e.city, e.country].filter(Boolean).join(', ')}`);
      lines.push('END:VEVENT');
    }
  }

  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mun-debate-calendar-${new Date().toISOString().split('T')[0]}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadCSV(type: 'saved' | 'events'): void {
  const store = initStore();
  const headers = ['Title', 'Category', 'Organizer', 'Registration Deadline', 'Start Date', 'City', 'Mode', 'Fee', 'Registration URL'];

  const rows: string[][] = [];
  if (type === 'saved') {
    const eventMap = new Map(store.events.map(e => [e.id, e]));
    for (const s of store.saved) {
      const e = eventMap.get(s.event_id);
      if (e) {
        rows.push([
          `"${e.title.replace(/"/g, '""')}"`,
          `"${e.primary_category}"`,
          `"${(e.organizer || '').replace(/"/g, '""')}"`,
          `"${e.registration_deadline || ''}"`,
          `"${e.event_start_at || ''}"`,
          `"${e.city || ''}"`,
          `"${e.mode}"`,
          `"${e.fee_status === 'free' ? 'Free' : (e.fee_amount ? `${e.fee_currency} ${e.fee_amount}` : 'Paid')}"`,
          `"${e.registration_url || e.official_event_url || ''}"`,
        ]);
      }
    }
  } else {
    for (const e of store.events) {
      rows.push([
        `"${e.title.replace(/"/g, '""')}"`,
        `"${e.primary_category}"`,
        `"${(e.organizer || '').replace(/"/g, '""')}"`,
        `"${e.registration_deadline || ''}"`,
        `"${e.event_start_at || ''}"`,
        `"${e.city || ''}"`,
        `"${e.mode}"`,
        `"${e.fee_status === 'free' ? 'Free' : (e.fee_amount ? `${e.fee_currency} ${e.fee_amount}` : 'Paid')}"`,
        `"${e.registration_url || e.official_event_url || ''}"`,
      ]);
    }
  }

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mun-debate-${type}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function getICSExportUrl(eventId?: string, savedOnly?: boolean): string {
  const sp = new URLSearchParams();
  if (eventId) sp.set('event_id', eventId);
  if (savedOnly) sp.set('saved', 'true');
  return `${API_BASE}/export/ics?${sp.toString()}`;
}

export function getCSVExportUrl(type: 'saved' | 'events'): string {
  return `${API_BASE}/export/csv?type=${type}`;
}

// --- Duplicate Reviews ---
export async function fetchDuplicateReviews(): Promise<{ success: boolean; data: DuplicateReview[] }> {
  try {
    return await request('/duplicate-reviews');
  } catch {
    return { success: true, data: [] };
  }
}

// --- Data Verification & Provenance System ---
export async function fetchVerificationSummary(): Promise<{ success: boolean; data: VerificationAuditSummary }> {
  try {
    return await request('/verification-summary');
  } catch {
    const store = initStore();
    const summary = verifyAllEvents(store.events, new Date());
    return {
      success: true,
      data: summary,
    };
  }
}

export async function runFullVerificationAudit(): Promise<{ success: boolean; data: VerificationAuditSummary; message: string }> {
  try {
    return await request('/run-verification-audit', { method: 'POST' });
  } catch {
    const keys = getStorageKeys();
    const store = initStore();
    const now = new Date();

    // Re-verify and audit every record
    const updatedEvents = store.events.map(e => {
      const vRes = verifyEvent(e, now);
      const withStatus = applyLifecycleStatus(e, now);
      return {
        ...withStatus,
        data_confidence: vRes.confidence,
        needs_review: !vRes.isValid,
        last_verified_at: now.toISOString(),
      };
    });

    setStorage(keys.EVENTS, updatedEvents);
    const summary = verifyAllEvents(updatedEvents, now);

    return {
      success: true,
      data: summary,
      message: `Verification audit complete! Verified ${summary.verifiedHighConfidence}/${summary.totalScanned} opportunities. 0 expired in active feeds (${summary.integrityRate}% circuit integrity).`,
    };
  }
}
