// ============================================================
// Events Page — Master Event Explorer & Discovery Hub
// ============================================================

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Globe, ExternalLink, Calendar, MapPin, DollarSign, Bookmark,
  BookmarkCheck, ChevronLeft, ChevronRight, Filter, AlertCircle,
} from 'lucide-react';
import { useEvents, useSaveEvent, useDeleteSavedEvent } from '../hooks';
import { EventCard, EventCardSkeleton } from '../components/events/EventCard';
import { EventFiltersBar } from '../components/events/EventFiltersBar';
import type { EventCategory, EventFilters, EventMode, RegistrationStatus, FeeStatus } from '../types';
import { CATEGORY_LABELS, STATUS_LABELS } from '../types';
import { formatDate, getCountdown, getStatusBadgeClass, formatCurrency } from '../utils';

export function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const saveEvent = useSaveEvent();
  const deleteSaved = useDeleteSavedEvent();

  const [viewMode, setViewMode] = useState<'grid' | 'compact' | 'table'>('grid');

  // Parse filters from URL
  const [filters, setFilters] = useState<EventFilters>(() => {
    const cats = searchParams.get('category')?.split(',').filter(Boolean) as EventCategory[];
    const mode = searchParams.get('mode')?.split(',').filter(Boolean) as EventMode[];
    const search = searchParams.get('search') || undefined;
    const city = searchParams.get('city') || undefined;
    const scope = (searchParams.get('scope') as any) || 'active';
    return {
      search,
      categories: cats?.length ? cats : undefined,
      mode: mode?.length ? mode : undefined,
      locations: city ? [city] : undefined,
      scope,
      page: 1,
      limit: 12,
      sortBy: 'registration_deadline',
      sortOrder: 'asc',
    };
  });

  // Keep in sync when URL changes
  useEffect(() => {
    const cats = searchParams.get('category')?.split(',').filter(Boolean) as EventCategory[];
    const mode = searchParams.get('mode')?.split(',').filter(Boolean) as EventMode[];
    const search = searchParams.get('search') || undefined;
    const city = searchParams.get('city') || undefined;
    const scope = (searchParams.get('scope') as any) || 'active';

    setFilters(prev => ({
      ...prev,
      search,
      categories: cats?.length ? cats : undefined,
      mode: mode?.length ? mode : undefined,
      locations: city ? [city] : undefined,
      scope,
      page: 1,
    }));
  }, [searchParams]);

  const { data: response, isLoading } = useEvents(filters);

  const events = response?.data || [];
  const total = response?.total ?? 0;
  const page = response?.page ?? 1;
  const totalPages = response?.totalPages ?? 1;

  const handleFilterChange = (newFilters: EventFilters) => {
    setFilters(newFilters);
    // Sync critical filters back to URL
    const sp = new URLSearchParams();
    if (newFilters.search) sp.set('search', newFilters.search);
    if (newFilters.categories?.length) sp.set('category', newFilters.categories.join(','));
    if (newFilters.mode?.length) sp.set('mode', newFilters.mode.join(','));
    if (newFilters.locations?.length) sp.set('city', newFilters.locations.join(','));
    if (newFilters.scope && newFilters.scope !== 'active') sp.set('scope', newFilters.scope);
    setSearchParams(sp, { replace: true });
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            {filters.scope === 'archived'
              ? 'Past & Concluded Circuit Opportunities'
              : filters.scope === 'closing_soon'
              ? 'Closing Soon — Urgent Registrations'
              : 'Active Circuit Opportunities & Tournaments'}
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            {filters.scope === 'archived'
              ? `${total} concluded competitions preserved for historical reference and circuit tracking`
              : `${total} verified opportunities discovered across Model UN, Debates, Training Workshops, Moot Courts, and Case Competitions`}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <EventFiltersBar
        filters={filters}
        onChange={handleFilterChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalCount={total}
      />

      {/* Results Content */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '18px' }}>
          {Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)}
        </div>
      ) : events.length === 0 ? (
        <div
          className="card"
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            background: 'var(--color-bg-secondary)',
            borderRadius: '16px',
            marginTop: '20px',
          }}
        >
          <AlertCircle size={40} color="var(--color-text-tertiary)" style={{ margin: '0 auto 14px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
            No Matching Events Found
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', maxWidth: '440px', margin: '0 auto 20px' }}>
            Try broadening your search term, clearing location or mode constraints, or removing category filters.
          </p>
          <button className="btn btn-secondary" onClick={() => handleFilterChange({ page: 1, limit: 12 })}>
            Reset All Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '18px' }}>
          {events.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : viewMode === 'compact' ? (
        /* Compact List View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {events.map(event => {
            const cd = getCountdown(event.registration_deadline);
            const isSaved = Boolean(event.saved_status);
            return (
              <div
                key={event.id}
                className="card card-clickable"
                onClick={() => navigate(`/events/${event.id}`)}
                style={{
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 300px' }}>
                  <button
                    className={`btn-bookmark ${isSaved ? 'saved' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isSaved && event.saved_id) {
                        deleteSaved.mutate(event.saved_id);
                      } else {
                        saveEvent.mutate({ eventId: event.id });
                      }
                    }}
                  >
                    {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                  </button>

                  <div>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '4px', alignItems: 'center' }}>
                      <span className="badge badge-category" style={{ fontSize: '0.7rem' }}>
                        {CATEGORY_LABELS[event.primary_category] || event.primary_category}
                      </span>
                      <span className={`badge ${getStatusBadgeClass(event.registration_status)}`} style={{ fontSize: '0.7rem' }}>
                        {STATUS_LABELS[event.registration_status] || event.registration_status}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-text-primary)' }}>
                      {event.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      {event.organizer} • {[event.city, event.country].filter(Boolean).join(', ') || 'Online'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {event.registration_deadline && (
                    <span className={`countdown ${cd.urgency === 'urgent' ? 'countdown-urgent' : cd.urgency === 'soon' ? 'countdown-soon' : 'countdown-ok'}`} style={{ fontSize: '0.75rem' }}>
                      {cd.text}
                    </span>
                  )}

                  {(event.registration_url || event.official_event_url) && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(event.registration_url || event.official_event_url!, '_blank', 'noopener,noreferrer');
                      }}
                      style={{ fontSize: '0.75rem' }}
                    >
                      <ExternalLink size={13} /> Register
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div style={{ overflowX: 'auto', background: 'var(--color-bg-secondary)', borderRadius: '12px', border: '1px solid var(--color-border-primary)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border-primary)', background: 'var(--color-bg-tertiary)' }}>
                <th style={{ padding: '12px 16px' }}>Title & Host</th>
                <th style={{ padding: '12px 16px' }}>Category</th>
                <th style={{ padding: '12px 16px' }}>Mode & Venue</th>
                <th style={{ padding: '12px 16px' }}>Fee</th>
                <th style={{ padding: '12px 16px' }}>Deadline</th>
                <th style={{ padding: '12px 16px' }}>Event Dates</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => {
                const cd = getCountdown(event.registration_deadline);
                return (
                  <tr
                    key={event.id}
                    onClick={() => navigate(`/events/${event.id}`)}
                    style={{ borderBottom: '1px solid var(--color-border-primary)', cursor: 'pointer' }}
                    className="table-row-hover"
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{event.title}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)' }}>{event.organizer}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="badge badge-category" style={{ fontSize: '0.7rem' }}>
                        {CATEGORY_LABELS[event.primary_category] || event.primary_category}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div>{event.mode === 'online' ? '🌐 Online' : event.mode === 'hybrid' ? '🔄 Hybrid' : '📍 In-Person'}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--color-text-tertiary)' }}>{event.city || '—'}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {event.fee_status === 'free' ? 'Free' : event.fee_amount ? formatCurrency(event.fee_amount, event.fee_currency) : 'Paid'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600 }}>{formatDate(event.registration_deadline)}</div>
                      <div style={{ fontSize: '0.72rem', color: cd.urgency === 'urgent' ? 'var(--color-error)' : 'var(--color-text-tertiary)' }}>
                        {cd.text}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {formatDate(event.event_start_at)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {(event.registration_url || event.official_event_url) && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(event.registration_url || event.official_event_url!, '_blank', 'noopener,noreferrer');
                          }}
                          style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                        >
                          Register
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', borderTop: '1px solid var(--color-border-primary)', paddingTop: '16px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            Page {page} of {totalPages} ({total} opportunities)
          </span>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page <= 1}
              onClick={() => handleFilterChange({ ...filters, page: page - 1 })}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page >= totalPages}
              onClick={() => handleFilterChange({ ...filters, page: page + 1 })}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
