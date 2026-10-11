// ============================================================
// Closing Soon Page — High Urgency Deadline Tracker
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, AlertTriangle, ExternalLink, Calendar, MapPin, DollarSign,
  Download, Bookmark, BookmarkCheck, ArrowRight,
} from 'lucide-react';
import { useClosingSoon, useSaveEvent, useDeleteSavedEvent } from '../hooks';
import { formatDate, getCountdown, getStatusBadgeClass, formatCurrency } from '../utils';
import { CATEGORY_LABELS } from '../types';
import { downloadICS } from '../services/api';

export function ClosingSoonPage() {
  const navigate = useNavigate();
  const [daysWindow, setDaysWindow] = useState(7);
  const { data: events, isLoading } = useClosingSoon(daysWindow);
  const saveEvent = useSaveEvent();
  const deleteSaved = useDeleteSavedEvent();

  const closingList = events || [];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-closing" style={{ fontSize: '0.74rem' }}>
              <Clock size={12} style={{ marginRight: '4px' }} /> Urgent Registration Windows
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            Closing Soon — Deadline Radar
          </h1>
          <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Never miss an application deadline again. Track conferences and tournaments with active closing timers.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => downloadICS(undefined, false)}>
            <Download size={14} /> Export Deadlines to iCal
          </button>
        </div>
      </div>

      {/* Days Window Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '22px', borderBottom: '1px solid var(--color-border-primary)', paddingBottom: '12px' }}>
        {[
          { days: 1, label: 'Closing in 24 Hours' },
          { days: 3, label: 'Closing in 3 Days' },
          { days: 7, label: 'Closing in 7 Days' },
          { days: 14, label: 'Closing in 14 Days' },
        ].map((tab) => (
          <button
            key={tab.days}
            className={`filter-chip ${daysWindow === tab.days ? 'active' : ''}`}
            onClick={() => setDaysWindow(tab.days)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Results Content */}
      {isLoading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
          Scanning registration closing deadlines...
        </div>
      ) : closingList.length === 0 ? (
        <div
          className="card"
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            background: 'var(--color-bg-secondary)',
            borderRadius: '16px',
          }}
        >
          <Clock size={44} color="var(--color-status-open)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
            No Deadlines in the Next {daysWindow} Days
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', maxWidth: '440px', margin: '0 auto 20px' }}>
            You are all caught up! Check broader windows or explore other upcoming conferences.
          </p>
          <button className="btn btn-secondary" onClick={() => setDaysWindow(14)}>
            Check 14-Day Window
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {closingList.map((event) => {
            const cd = getCountdown(event.registration_deadline);
            const isSaved = Boolean(event.saved_status);

            return (
              <div
                key={event.id}
                className="card card-clickable"
                onClick={() => navigate(`/events/${event.id}`)}
                style={{
                  borderLeft: `5px solid ${cd.urgency === 'urgent' ? 'var(--color-error)' : 'var(--color-warning)'}`,
                  background: 'var(--color-bg-secondary)',
                  padding: '20px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '20px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: '1 1 360px' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                    <span className="badge badge-category" style={{ fontSize: '0.72rem' }}>
                      {CATEGORY_LABELS[event.primary_category] || event.primary_category}
                    </span>
                    <span className="badge badge-mode" style={{ fontSize: '0.72rem' }}>
                      {event.mode === 'online' ? '🌐 Online' : event.mode === 'hybrid' ? '🔄 Hybrid' : '📍 In-Person'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                    {event.title}
                  </h3>

                  <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                    {event.organizer && <span>Host: {event.organizer}</span>}
                    {(event.city || event.country) && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={13} /> {[event.city, event.country].filter(Boolean).join(', ')}
                      </span>
                    )}
                    {event.fee_status !== 'unknown' && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <DollarSign size={13} /> {event.fee_status === 'free' ? 'Free' : event.fee_amount ? formatCurrency(event.fee_amount, event.fee_currency) : 'Paid'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Action & Countdown Gauge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      className={`countdown ${cd.urgency === 'urgent' ? 'countdown-urgent' : 'countdown-soon'}`}
                      style={{ fontSize: '0.85rem', fontWeight: 800, padding: '6px 14px' }}
                    >
                      <Clock size={14} style={{ marginRight: '6px' }} />
                      {cd.text}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                      Closes: {formatDate(event.registration_deadline)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
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
                      title={isSaved ? 'Remove from saved' : 'Save event'}
                    >
                      {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                    </button>

                    {(event.registration_url || event.official_event_url) && (
                      <button
                        className="btn btn-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(event.registration_url || event.official_event_url!, '_blank', 'noopener,noreferrer');
                        }}
                      >
                        <ExternalLink size={15} /> Register Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
