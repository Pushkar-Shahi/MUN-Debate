// ============================================================
// Dashboard Page Component
// ============================================================

import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Calendar, Clock, Bookmark, Globe, ArrowRight, Sparkles,
  Trophy, CheckCircle, AlertTriangle, ShieldCheck, Plus, Filter,
} from 'lucide-react';
import { useDashboardStats, useEvents, useClosingSoon } from '../hooks';
import { EventCard, EventCardSkeleton } from '../components/events/EventCard';
import { formatDateShort, getCountdown } from '../utils';
import type { EventCategory } from '../types';

interface OutletContextType {
  openDetailModal: (id: string) => void;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const context = useOutletContext<OutletContextType>();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: closingData, isLoading: closingLoading } = useClosingSoon(7);

  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'all'>('all');
  const { data: eventsData, isLoading: eventsLoading } = useEvents({
    categories: selectedCategory !== 'all' ? [selectedCategory] : undefined,
    limit: 6,
    sortBy: 'registration_deadline',
  });

  const closingEvents = closingData || [];
  const events = eventsData?.data || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.08) 50%, rgba(22, 22, 29, 0.9) 100%)',
          border: '1px solid var(--color-border-accent)',
          borderRadius: '16px',
          padding: '24px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-accent)' }}>
              Discovery & Application Command Center
            </span>
            <span style={{ display: 'inline-flex', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-status-open)' }} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
            MUN & Debate Central
          </h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', maxWidth: '640px' }}>
            Unified portal tracking Model UN conferences, parliamentary debate tournaments, Youth Parliament festivals, and orator championships across India and internationally.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/calendar')}>
            <Calendar size={15} /> View Calendar
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/events')}>
            <Globe size={15} /> Explore All Events
          </button>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <div className="card stat-card" onClick={() => navigate('/events')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>Upcoming Events</span>
            <Globe size={18} color="var(--color-accent-primary)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            {statsLoading ? '…' : stats?.upcomingEvents ?? 0}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
            Across all circuits
          </span>
        </div>

        <div className="card stat-card" onClick={() => navigate('/events?status=open')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>Registration Open</span>
            <CheckCircle size={18} color="var(--color-status-open)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-status-open)' }}>
            {statsLoading ? '…' : stats?.registrationOpen ?? 0}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
            Active applications
          </span>
        </div>

        <div className="card stat-card" onClick={() => navigate('/closing-soon')} style={{ cursor: 'pointer', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-status-closing)', fontWeight: 600 }}>Closing in 7 Days</span>
            <AlertTriangle size={18} color="var(--color-status-closing)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-status-closing)' }}>
            {statsLoading ? '…' : stats?.closingSoon ?? 0}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
            Action required soon
          </span>
        </div>

        <div className="card stat-card" onClick={() => navigate('/events?mode=online')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>Online Events</span>
            <Sparkles size={18} color="var(--color-accent-secondary)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            {statsLoading ? '…' : stats?.onlineEvents ?? 0}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
            Zero travel required
          </span>
        </div>

        <div className="card stat-card" onClick={() => navigate('/saved')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>Saved Opportunities</span>
            <Bookmark size={18} color="var(--color-accent-primary)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            {statsLoading ? '…' : stats?.savedEvents ?? 0}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
            In personal tracker
          </span>
        </div>

        <div className="card stat-card" onClick={() => navigate('/applications')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>Registered Teams</span>
            <Trophy size={18} color="var(--color-accent-secondary)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            {statsLoading ? '…' : stats?.registeredEvents ?? 0}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
            Confirmed participation
          </span>
        </div>
      </div>

      {/* Urgent Closing Soon Countdown Rail */}
      {closingEvents.length > 0 && (
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="var(--color-status-closing)" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Urgent Deadlines — Closing This Week
              </h2>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/closing-soon')}
              style={{ fontSize: '0.8rem', color: 'var(--color-status-closing)' }}
            >
              View all closing soon <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {closingEvents.slice(0, 3).map((event) => {
              const cd = getCountdown(event.registration_deadline);
              return (
                <div
                  key={event.id}
                  className="card card-clickable"
                  onClick={() => context.openDetailModal(event.id)}
                  style={{
                    borderLeft: `4px solid ${cd.urgency === 'urgent' ? 'var(--color-error)' : 'var(--color-warning)'}`,
                    background: 'var(--color-bg-secondary)',
                    padding: '18px 20px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span className="badge badge-category" style={{ fontSize: '0.72rem' }}>
                      {event.primary_category.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span
                      className={`countdown ${cd.urgency === 'urgent' ? 'countdown-urgent' : 'countdown-soon'}`}
                      style={{ fontSize: '0.75rem', fontWeight: 700 }}
                    >
                      <Clock size={12} style={{ marginRight: '4px' }} />
                      {cd.text}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
                    {event.title}
                  </h3>

                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
                    {event.organizer} • {event.city || 'Online'}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border-primary)', paddingTop: '10px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                      Deadline: {formatDateShort(event.registration_deadline)}
                    </span>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (event.registration_url || event.official_event_url) {
                          window.open(event.registration_url || event.official_event_url!, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    >
                      Register Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Featured Opportunities Hub */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Discover Opportunities
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              Handpicked and verified conferences, tournaments, and competitions
            </p>
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              className={`filter-chip btn-sm ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
              style={{ fontSize: '0.76rem', padding: '4px 10px' }}
            >
              All Events
            </button>
            <button
              className={`filter-chip btn-sm ${selectedCategory === 'mun' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('mun')}
              style={{ fontSize: '0.76rem', padding: '4px 10px' }}
            >
              Model UN
            </button>
            <button
              className={`filter-chip btn-sm ${selectedCategory === 'parliamentary_debate' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('parliamentary_debate')}
              style={{ fontSize: '0.76rem', padding: '4px 10px' }}
            >
              Parliamentary Debate
            </button>
            <button
              className={`filter-chip btn-sm ${selectedCategory === 'youth_parliament' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('youth_parliament')}
              style={{ fontSize: '0.76rem', padding: '4px 10px' }}
            >
              Youth Parliament
            </button>
            <button
              className={`filter-chip btn-sm ${selectedCategory === 'public_speaking' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('public_speaking')}
              style={{ fontSize: '0.76rem', padding: '4px 10px' }}
            >
              Public Speaking
            </button>
          </div>
        </div>

        {/* Events Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '18px' }}>
          {eventsLoading ? (
            Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)
          ) : events.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
              No events found in this category.
            </div>
          ) : (
            events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/events')}>
            View All {stats?.upcomingEvents || ''} Events in Directory <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}
