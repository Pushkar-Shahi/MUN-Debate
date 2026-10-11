// ============================================================
// Calendar Page — Interactive Schedule & Deadline View
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock,
  MapPin, ExternalLink, Download, Filter, Tag,
} from 'lucide-react';
import { useCalendarEvents } from '../hooks';
import { getCalendarDays, formatDate, formatDateShort, format, isToday } from '../utils';
import { CATEGORY_LABELS } from '../types';
import { downloadICS } from '../services/api';

export function CalendarPage() {
  const navigate = useNavigate();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [filterType, setFilterType] = useState<'all' | 'deadlines' | 'events'>('all');

  const startOfMonthStr = new Date(currentYear, currentMonth, 1).toISOString();
  const endOfMonthStr = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).toISOString();

  const { data: events, isLoading } = useCalendarEvents(startOfMonthStr, endOfMonthStr);
  const allEvents = events || [];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(today);
  };

  const daysGrid = getCalendarDays(currentYear, currentMonth);

  // Helper to get events for a specific day
  const getEventsForDay = (date: Date) => {
    const dStr = format(date, 'yyyy-MM-dd');
    return allEvents.filter(e => {
      const regDate = e.registration_deadline ? format(new Date(e.registration_deadline), 'yyyy-MM-dd') : null;
      const startDate = e.event_start_at ? format(new Date(e.event_start_at), 'yyyy-MM-dd') : null;
      const endDate = e.event_end_at ? format(new Date(e.event_end_at), 'yyyy-MM-dd') : null;

      const matchesDeadline = regDate === dStr;
      const matchesEvent = startDate === dStr || endDate === dStr || (startDate && endDate && dStr >= startDate && dStr <= endDate);

      if (filterType === 'deadlines') return matchesDeadline;
      if (filterType === 'events') return matchesEvent;
      return matchesDeadline || matchesEvent;
    });
  };

  const selectedDayEvents = getEventsForDay(selectedDate);
  const monthTitle = format(new Date(currentYear, currentMonth, 1), 'MMMM yyyy');

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            Calendar & Deadlines
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Comprehensive month view tracking registration cutoffs and conference dates
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => downloadICS()}>
            <Download size={14} /> Export iCal Feed
          </button>
        </div>
      </div>

      {/* Month Navigation & Controls Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, minWidth: '180px' }}>
            {monthTitle}
          </h2>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="btn btn-secondary btn-sm btn-icon" onClick={handlePrevMonth}>
              <ChevronLeft size={16} />
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleToday}>
              Today
            </button>
            <button className="btn btn-secondary btn-sm btn-icon" onClick={handleNextMonth}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Filter Switcher */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className={`filter-chip btn-sm ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All Items
          </button>
          <button
            className={`filter-chip btn-sm ${filterType === 'deadlines' ? 'active' : ''}`}
            onClick={() => setFilterType('deadlines')}
          >
            Deadlines Only
          </button>
          <button
            className={`filter-chip btn-sm ${filterType === 'events' ? 'active' : ''}`}
            onClick={() => setFilterType('events')}
          >
            Conferences Only
          </button>
        </div>
      </div>

      {/* Main Calendar Layout: Grid + Selected Day Rail */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '20px' }}>
        {/* Calendar Grid Container */}
        <div className="card" style={{ padding: '16px', background: 'var(--color-bg-secondary)', borderRadius: '16px' }}>
          {/* Day of Week Headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 700, fontSize: '0.78rem', color: 'var(--color-text-secondary)', paddingBottom: '12px', borderBottom: '1px solid var(--color-border-primary)' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginTop: '6px' }}>
            {daysGrid.map((item, idx) => {
              const dEvents = getEventsForDay(item.date);
              const isSelected = format(item.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
              const isCurrentDay = isToday(item.date);

              const hasDeadline = dEvents.some(e => e.registration_deadline && format(new Date(e.registration_deadline), 'yyyy-MM-dd') === format(item.date, 'yyyy-MM-dd'));
              const hasEventDay = dEvents.some(e => e.event_start_at && format(new Date(e.event_start_at), 'yyyy-MM-dd') === format(item.date, 'yyyy-MM-dd'));

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(item.date)}
                  style={{
                    minHeight: '84px',
                    padding: '8px',
                    borderRadius: '8px',
                    background: isSelected
                      ? 'var(--color-accent-soft)'
                      : item.isCurrentMonth
                        ? 'var(--color-bg-tertiary)'
                        : 'rgba(255,255,255,0.01)',
                    border: isSelected
                      ? '2px solid var(--color-accent-primary)'
                      : isCurrentDay
                        ? '1px solid var(--color-accent-secondary)'
                        : '1px solid transparent',
                    cursor: 'pointer',
                    opacity: item.isCurrentMonth ? 1 : 0.35,
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontWeight: isCurrentDay ? 800 : 600,
                      fontSize: '0.82rem',
                      color: isCurrentDay ? 'var(--color-accent-primary)' : 'var(--color-text-primary)',
                    }}>
                      {item.date.getDate()}
                    </span>
                    {isCurrentDay && (
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--color-accent-primary)' }} />
                    )}
                  </div>

                  {/* Day Pills / Dots */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                    {dEvents.slice(0, 2).map((e) => {
                      const isDead = e.registration_deadline && format(new Date(e.registration_deadline), 'yyyy-MM-dd') === format(item.date, 'yyyy-MM-dd');
                      return (
                        <div
                          key={e.id}
                          style={{
                            fontSize: '0.66rem',
                            fontWeight: 600,
                            padding: '2px 4px',
                            borderRadius: '4px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            background: isDead ? 'rgba(239, 68, 68, 0.25)' : 'rgba(99, 102, 241, 0.25)',
                            color: isDead ? '#fca5a5' : '#c7d2fe',
                            borderLeft: `2px solid ${isDead ? 'var(--color-error)' : 'var(--color-accent-primary)'}`,
                          }}
                        >
                          {isDead ? '⏰ ' : '📅 '} {e.title}
                        </div>
                      );
                    })}
                    {dEvents.length > 2 && (
                      <span style={{ fontSize: '0.62rem', color: 'var(--color-text-tertiary)' }}>
                        +{dEvents.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda Rail */}
        <div className="card" style={{ padding: '20px', background: 'var(--color-bg-secondary)', borderRadius: '16px', height: 'fit-content' }}>
          <div style={{ borderBottom: '1px solid var(--color-border-primary)', paddingBottom: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Selected Date
            </span>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              {format(selectedDate, 'EEEE, dd MMMM yyyy')}
            </h3>
          </div>

          {selectedDayEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--color-text-tertiary)', fontSize: '0.85rem' }}>
              <CalendarIcon size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
              No deadlines or conference schedules recorded on this date.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {selectedDayEvents.map((event) => {
                const isDeadlineDay = event.registration_deadline && format(new Date(event.registration_deadline), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                return (
                  <div
                    key={event.id}
                    onClick={() => navigate(`/events/${event.id}`)}
                    style={{
                      background: 'var(--color-bg-tertiary)',
                      border: `1px solid ${isDeadlineDay ? 'rgba(239, 68, 68, 0.4)' : 'var(--color-border-primary)'}`,
                      borderRadius: '10px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span className={`badge ${isDeadlineDay ? 'badge-closing' : 'badge-open'}`} style={{ fontSize: '0.68rem' }}>
                        {isDeadlineDay ? 'Registration Deadline' : 'Conference Day'}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>
                        {CATEGORY_LABELS[event.primary_category] || event.primary_category}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                      {event.title}
                    </h4>

                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
                      {event.organizer} • {event.city || 'Online'}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-accent)' }}>
                        View Details →
                      </span>
                      {(event.registration_url || event.official_event_url) && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(event.registration_url || event.official_event_url!, '_blank', 'noopener,noreferrer');
                          }}
                          style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                        >
                          Register
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
