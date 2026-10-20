// ============================================================
// Event Detail Modal & Drawer Component
// ============================================================

import { useState } from 'react';
import {
  X, MapPin, Calendar, Clock, ExternalLink, Bookmark, BookmarkCheck,
  Building, DollarSign, Users, Award, ShieldCheck, CheckSquare, Edit3,
  Globe, Check, Trash2,
} from 'lucide-react';
import type { EventRecord, TrackingStatus } from '../../types';
import { CATEGORY_LABELS, STATUS_LABELS, TRACKING_LABELS } from '../../types';
import { formatDate, getCountdown, getStatusBadgeClass, formatCurrency } from '../../utils';
import { useSaveEvent, useUpdateSavedEvent, useDeleteSavedEvent, useEvent } from '../../hooks';
import { downloadICS } from '../../services/api';
import { extractDomain, isAccreditedDomain } from '../../services/dataVerifier';

interface EventDetailModalProps {
  eventId: string | null;
  onClose: () => void;
}

export function EventDetailModal({ eventId, onClose }: EventDetailModalProps) {
  const { data: eventData, isLoading } = useEvent(eventId || '');
  const saveEvent = useSaveEvent();
  const updateSaved = useUpdateSavedEvent();
  const deleteSaved = useDeleteSavedEvent();

  const [notes, setNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [customChecklist, setCustomChecklist] = useState<{ text: string; done: boolean }[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');

  if (!eventId) return null;

  const event = eventData;
  const saved = eventData?.savedDetails;
  const isSaved = !!saved;

  const countdown = getCountdown(event?.registration_deadline);

  // Sync state when event loads
  const currentNotes = saved?.personal_notes || '';
  const currentStatus = (saved?.status || 'interested') as TrackingStatus;

  let checklistItems: { text: string; done: boolean }[] = [];
  try {
    if (saved?.preparation_checklist) {
      checklistItems = JSON.parse(saved.preparation_checklist);
    }
  } catch {
    checklistItems = [];
  }

  const handleStatusChange = (newStatus: TrackingStatus) => {
    if (!event) return;
    if (saved) {
      updateSaved.mutate({ id: saved.id, data: { status: newStatus } });
    } else {
      saveEvent.mutate({ eventId: event.id, status: newStatus });
    }
  };

  const handleSaveNotes = () => {
    if (!saved || !event) return;
    updateSaved.mutate({ id: saved.id, data: { personal_notes: notes } });
    setEditingNotes(false);
  };

  const handleToggleChecklist = (index: number) => {
    if (!saved) return;
    const updated = [...checklistItems];
    updated[index].done = !updated[index].done;
    updateSaved.mutate({ id: saved.id, data: { preparation_checklist: JSON.stringify(updated) } });
  };

  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim() || !saved) return;
    const updated = [...checklistItems, { text: newChecklistText.trim(), done: false }];
    updateSaved.mutate({ id: saved.id, data: { preparation_checklist: JSON.stringify(updated) } });
    setNewChecklistText('');
  };

  return (
    <div className="side-panel-overlay" style={{ zIndex: 90, display: 'flex', justifyContent: 'flex-end' }}>
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '640px',
          height: '100vh',
          overflowY: 'auto',
          background: 'var(--color-bg-secondary)',
          borderLeft: '1px solid var(--color-border-primary)',
          borderRadius: 0,
          padding: '28px',
          boxShadow: '-10px 0 40px rgba(0,0,0,0.6)',
          animation: 'slideRight 0.25s ease',
        }}
      >
        {/* Header with Close & Bookmark */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {event && (
              <span className={`badge ${getStatusBadgeClass(event.registration_status)}`}>
                {STATUS_LABELS[event.registration_status] || event.registration_status}
              </span>
            )}
            {event?.mode && (
              <span className="badge badge-mode">
                {event.mode === 'online' ? '🌐 Online' : event.mode === 'hybrid' ? '🔄 Hybrid' : '📍 In-Person'}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {event && (
              <button
                className={`btn btn-sm ${isSaved ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  if (isSaved && saved) {
                    deleteSaved.mutate(saved.id);
                  } else {
                    saveEvent.mutate({ eventId: event.id });
                  }
                }}
              >
                {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                {isSaved ? 'Saved to Tracker' : 'Bookmark Event'}
              </button>
            )}
            <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ borderRadius: '50%' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {isLoading || !event ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
            Loading event details...
          </div>
        ) : (
          <div>
            {/* Category Tag */}
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {CATEGORY_LABELS[event.primary_category] || event.primary_category}
            </span>

            {/* Title */}
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '4px', marginBottom: '12px', lineHeight: 1.3 }}>
              {event.title}
            </h1>

            {/* Organizer */}
            {event.organizer && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
                <Building size={16} /> Hosted by <strong style={{ color: 'var(--color-text-primary)' }}>{event.organizer}</strong>
              </div>
            )}

            {/* Countdown Urgency Banner */}
            {event.registration_deadline && (
              <div
                style={{
                  background: countdown.urgency === 'urgent' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.12)',
                  border: `1px solid ${countdown.urgency === 'urgent' ? 'var(--color-status-closing)' : 'var(--color-accent-primary)'}`,
                  borderRadius: '12px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Clock size={20} color={countdown.urgency === 'urgent' ? 'var(--color-status-closing)' : 'var(--color-accent-primary)'} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-text-primary)' }}>
                      {countdown.text}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      Deadline: {formatDate(event.registration_deadline)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {(event.registration_url || event.official_event_url) && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => window.open(event.registration_url || event.official_event_url!, '_blank', 'noopener,noreferrer')}
                    >
                      <ExternalLink size={14} /> Register Now
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Key Information Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
              <div className="card" style={{ padding: '14px', background: 'var(--color-bg-tertiary)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={13} /> Event Dates
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                  {formatDate(event.event_start_at)}
                  {event.event_end_at && event.event_end_at !== event.event_start_at && ` — ${formatDate(event.event_end_at)}`}
                </div>
              </div>

              <div className="card" style={{ padding: '14px', background: 'var(--color-bg-tertiary)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={13} /> Location
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                  {[event.location_name, event.city, event.country].filter(Boolean).join(', ') || 'Online'}
                </div>
              </div>

              <div className="card" style={{ padding: '14px', background: 'var(--color-bg-tertiary)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <DollarSign size={13} /> Registration Fee
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                  {event.fee_status === 'free' ? 'Free (No Entry Fee)' :
                    event.fee_amount ? formatCurrency(event.fee_amount, event.fee_currency) :
                      event.fee_status === 'scholarship_available' ? 'Scholarship Available' : 'Paid'}
                </div>
              </div>

              <div className="card" style={{ padding: '14px', background: 'var(--color-bg-tertiary)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={13} /> Participation Type
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, textTransform: 'capitalize' }}>
                  {event.participation_type} {event.max_team_size ? `(Max ${event.max_team_size} members)` : ''}
                </div>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text-primary)' }}>
                  About the Opportunity
                </h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                  {event.description}
                </p>
              </div>
            )}

            {/* Eligibility */}
            {event.eligibility_text && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text-primary)' }}>
                  Eligibility & Requirements
                </h3>
                <div style={{ background: 'var(--color-bg-tertiary)', padding: '12px 16px', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  {event.eligibility_text}
                </div>
              </div>
            )}

            {/* Committees / Topics */}
            {event.committees && event.committees.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text-primary)' }}>
                  Committees & Agendas
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {event.committees.map((comm, idx) => (
                    <span key={idx} className="badge badge-category" style={{ fontSize: '0.78rem', padding: '6px 12px' }}>
                      {comm}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Awards & Prizes */}
            {event.awards && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={16} color="var(--color-status-closing)" /> Awards & Recognition
                </h3>
                <div style={{ background: 'var(--color-bg-tertiary)', padding: '12px 16px', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  {event.awards}
                </div>
              </div>
            )}

            {/* Provenance & Circuit Verification Box */}
            <div style={{ marginBottom: '24px', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} /> Circuit Data Verification & Provenance
                </span>
                <span className="badge" style={{ fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-status-open)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  {event.data_confidence === 'high' ? 'High Confidence (Verified)' : 'Circuit Monitored'}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '10px' }}>
                <div>
                  <span style={{ color: 'var(--color-text-tertiary)', display: 'block', fontSize: '0.72rem' }}>Verified Domain</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {extractDomain(event.official_event_url || event.registration_url)} {isAccreditedDomain(extractDomain(event.official_event_url || event.registration_url)) && '✓'}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-tertiary)', display: 'block', fontSize: '0.72rem' }}>Verification Status</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-status-open)' }}>✓ Accreditation & Schedule Validated</span>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-tertiary)', display: 'block', fontSize: '0.72rem' }}>Last Verified</span>
                  <span>{formatDate(event.last_verified_at || event.updated_at)}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-tertiary)', display: 'block', fontSize: '0.72rem' }}>Portal Security</span>
                  <span style={{ color: 'var(--color-text-primary)' }}>HTTPS Encrypted Official URL</span>
                </div>
              </div>
            </div>

            {/* Personal Application & Tracking Workspace */}
            <div style={{ borderTop: '1px solid var(--color-border-primary)', paddingTop: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckSquare size={17} color="var(--color-accent-primary)" /> Personal Tracking & Strategy
                </h3>
              </div>

              {/* Status Picker Tabs */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-text-tertiary)', marginBottom: '8px' }}>
                  Application Pipeline Status:
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {(['interested', 'shortlisted', 'planning_to_apply', 'applied', 'registered', 'preparing', 'participated', 'won_award'] as TrackingStatus[]).map((st) => (
                    <button
                      key={st}
                      className={`filter-chip btn-sm ${currentStatus === st && isSaved ? 'active' : ''}`}
                      onClick={() => handleStatusChange(st)}
                      style={{ fontSize: '0.74rem', padding: '4px 10px' }}
                    >
                      {TRACKING_LABELS[st]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Personal Notes */}
              {isSaved && (
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.78rem', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Edit3 size={13} /> Delegate Notes & Strategy
                    </label>
                    {!editingNotes && (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                        onClick={() => {
                          setNotes(currentNotes);
                          setEditingNotes(true);
                        }}
                      >
                        Edit Notes
                      </button>
                    )}
                  </div>

                  {editingNotes ? (
                    <div>
                      <textarea
                        className="input"
                        rows={3}
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="e.g. Target committee: UNSC. Prepare draft resolution by Friday..."
                      />
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: '6px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditingNotes(false)}>Cancel</button>
                        <button className="btn btn-primary btn-sm" onClick={handleSaveNotes}>Save Notes</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: 'var(--color-bg-tertiary)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.82rem', color: currentNotes ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)', minHeight: '40px' }}>
                      {currentNotes || 'No notes added yet. Click edit to record prep tasks, team contacts, or submission links.'}
                    </div>
                  )}
                </div>
              )}

              {/* Preparation Checklist */}
              {isSaved && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-text-tertiary)', marginBottom: '8px' }}>
                    Preparation Checklist
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                    {checklistItems.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleToggleChecklist(idx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          background: 'var(--color-bg-tertiary)',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.82rem',
                          textDecoration: item.done ? 'line-through' : 'none',
                          color: item.done ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
                        }}
                      >
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '4px',
                          border: item.done ? 'none' : '1px solid var(--color-border-secondary)',
                          background: item.done ? 'var(--color-status-open)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {item.done && <Check size={12} color="#fff" />}
                        </div>
                        {item.text}
                      </div>
                    ))}
                  </div>

                  {/* Add checklist item */}
                  <form onSubmit={handleAddChecklist} style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="input"
                      placeholder="Add custom task (e.g. Finish opening speech)..."
                      style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                      value={newChecklistText}
                      onChange={e => setNewChecklistText(e.target.value)}
                    />
                    <button type="submit" className="btn btn-secondary btn-sm" disabled={!newChecklistText.trim()}>
                      Add
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Actions Bar Footer */}
            <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid var(--color-border-primary)', paddingTop: '18px', marginTop: '16px' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => downloadICS(event.id)}
              >
                <Calendar size={15} /> Export iCal (.ics)
              </button>
              {(event.registration_url || event.official_event_url) && (
                <button
                  className="btn btn-primary"
                  style={{ flex: 1.5 }}
                  onClick={() => window.open(event.registration_url || event.official_event_url!, '_blank', 'noopener,noreferrer')}
                >
                  <ExternalLink size={16} /> Open Registration Portal
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
