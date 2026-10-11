// ============================================================
// Event Card Component
// ============================================================

import { useNavigate } from 'react-router-dom';
import {
  MapPin, Calendar, Clock, ExternalLink, Bookmark, BookmarkCheck,
  Globe, Users, Tag, DollarSign, Building,
} from 'lucide-react';
import { CATEGORY_LABELS, STATUS_LABELS, type EventRecord } from '../../types';
import { formatDate, getCountdown, getStatusBadgeClass, formatCurrency } from '../../utils';
import { useSaveEvent, useDeleteSavedEvent } from '../../hooks';

interface EventCardProps {
  event: EventRecord & { saved_status?: string; saved_id?: string };
  compact?: boolean;
}

export function EventCard({ event, compact }: EventCardProps) {
  const navigate = useNavigate();
  const saveEvent = useSaveEvent();
  const deleteSaved = useDeleteSavedEvent();

  const countdown = getCountdown(event.registration_deadline);
  const isSaved = !!event.saved_status;

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaved && event.saved_id) {
      deleteSaved.mutate(event.saved_id);
    } else {
      saveEvent.mutate({ eventId: event.id });
    }
  };

  const handleRegister = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = event.registration_url || event.official_event_url;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="card card-clickable event-card"
      onClick={() => navigate(`/events/${event.id}`)}
      id={`event-card-${event.id}`}
    >
      <div className="event-card-header">
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span className="badge badge-category">
              {CATEGORY_LABELS[event.primary_category] || event.primary_category}
            </span>
            <span className={`badge ${getStatusBadgeClass(event.registration_status)}`}>
              {STATUS_LABELS[event.registration_status] || event.registration_status}
            </span>
            {event.mode !== 'unknown' && (
              <span className="badge badge-mode">
                {event.mode === 'online' ? '🌐 Online' : event.mode === 'hybrid' ? '🔄 Hybrid' : '📍 In-Person'}
              </span>
            )}
          </div>
          <h3 className="event-card-title">{event.title}</h3>
        </div>
        <button
          className={`btn-bookmark ${isSaved ? 'saved' : ''}`}
          onClick={handleBookmark}
          title={isSaved ? 'Remove bookmark' : 'Save event'}
          id={`bookmark-${event.id}`}
        >
          {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
        </button>
      </div>

      <div className="event-card-meta">
        {event.organizer && (
          <span className="event-card-meta-item">
            <Building size={13} /> {event.organizer}
          </span>
        )}
        {(event.event_start_at || event.event_end_at) && (
          <span className="event-card-meta-item">
            <Calendar size={13} />
            {formatDate(event.event_start_at)}
            {event.event_end_at && event.event_end_at !== event.event_start_at && ` — ${formatDate(event.event_end_at)}`}
          </span>
        )}
        {(event.city || event.country) && (
          <span className="event-card-meta-item">
            <MapPin size={13} /> {[event.city, event.country].filter(Boolean).join(', ')}
          </span>
        )}
        {event.fee_status !== 'unknown' && (
          <span className="event-card-meta-item">
            <DollarSign size={13} />
            {event.fee_status === 'free' ? 'Free' :
              event.fee_amount ? formatCurrency(event.fee_amount, event.fee_currency) :
                event.fee_status === 'scholarship_available' ? 'Scholarship available' : 'Paid'}
          </span>
        )}
        {event.eligibility_text && (
          <span className="event-card-meta-item">
            <Users size={13} /> {event.eligibility_text.length > 40 ? event.eligibility_text.substring(0, 40) + '…' : event.eligibility_text}
          </span>
        )}
      </div>

      <div className="event-card-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {event.registration_deadline && (
            <span className={`countdown ${countdown.urgency === 'urgent' ? 'countdown-urgent' : countdown.urgency === 'soon' ? 'countdown-soon' : countdown.urgency === 'ok' ? 'countdown-ok' : ''}`} style={{ fontSize: '0.75rem' }}>
              <Clock size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              {countdown.text}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {(event.registration_url || event.official_event_url) && (
            <button className="btn btn-primary btn-sm" onClick={handleRegister} id={`register-${event.id}`}>
              <ExternalLink size={13} />
              {event.registration_url ? 'Register' : 'View Official'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Loading Skeleton ---
export function EventCardSkeleton() {
  return (
    <div className="card event-card" style={{ pointerEvents: 'none' }}>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        <div className="skeleton" style={{ width: '100px', height: '22px' }} />
        <div className="skeleton" style={{ width: '80px', height: '22px' }} />
      </div>
      <div className="skeleton" style={{ width: '80%', height: '18px', marginBottom: '8px' }} />
      <div className="skeleton" style={{ width: '60%', height: '14px', marginBottom: '16px' }} />
      <div style={{ display: 'flex', gap: '12px' }}>
        <div className="skeleton" style={{ width: '120px', height: '14px' }} />
        <div className="skeleton" style={{ width: '100px', height: '14px' }} />
      </div>
      <div style={{ borderTop: '1px solid var(--color-border-primary)', marginTop: '14px', paddingTop: '14px', display: 'flex', justifyContent: 'space-between' }}>
        <div className="skeleton" style={{ width: '100px', height: '14px' }} />
        <div className="skeleton" style={{ width: '80px', height: '28px' }} />
      </div>
    </div>
  );
}
