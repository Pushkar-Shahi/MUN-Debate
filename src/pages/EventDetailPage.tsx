// ============================================================
// Event Detail Page — Dedicated URL View (/events/:id)
// ============================================================

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar, MapPin, DollarSign, Clock, ExternalLink, Bookmark,
  BookmarkCheck, Building, Users, Award, ShieldCheck, ChevronLeft,
  Check, Edit3, CheckSquare, Download,
} from 'lucide-react';
import { useEvent, useSaveEvent, useUpdateSavedEvent, useDeleteSavedEvent } from '../hooks';
import type { TrackingStatus } from '../types';
import { CATEGORY_LABELS, STATUS_LABELS, TRACKING_LABELS } from '../types';
import { formatDate, getCountdown, getStatusBadgeClass, formatCurrency } from '../utils';
import { downloadICS } from '../services/api';

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: event, isLoading, error } = useEvent(id || '');

  const saveEvent = useSaveEvent();
  const updateSaved = useUpdateSavedEvent();
  const deleteSaved = useDeleteSavedEvent();

  const [notes, setNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [newChecklistText, setNewChecklistText] = useState('');

  if (isLoading) {
    return (
      <div style={{ padding: '80px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
        Loading event details...
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="card" style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--color-bg-secondary)', borderRadius: '16px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Event Not Found</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
          The requested conference or debate tournament could not be found or has been removed.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/events')}>
          Browse All Events
        </button>
      </div>
    );
  }

  const saved = event.savedDetails;
  const isSaved = !!saved;
  const countdown = getCountdown(event.registration_deadline);
  const currentStatus = (saved?.status || 'interested') as TrackingStatus;
  const currentNotes = saved?.personal_notes || '';

  let checklistItems: { text: string; done: boolean }[] = [];
  try {
    if (saved?.preparation_checklist) {
      checklistItems = JSON.parse(saved.preparation_checklist);
    }
  } catch {
    checklistItems = [];
  }

  const handleStatusChange = (newStatus: TrackingStatus) => {
    if (saved) {
      updateSaved.mutate({ id: saved.id, data: { status: newStatus } });
    } else {
      saveEvent.mutate({ eventId: event.id, status: newStatus });
    }
  };

  const handleSaveNotes = () => {
    if (!saved) return;
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
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Back button */}
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => navigate(-1)}
        style={{ marginBottom: '16px', color: 'var(--color-text-secondary)' }}
      >
        <ChevronLeft size={16} /> Back to Directory
      </button>

      {/* Main Event Card */}
      <div className="card" style={{ background: 'var(--color-bg-secondary)', borderRadius: '16px', padding: '32px', border: '1px solid var(--color-border-primary)' }}>
        {/* Badges & Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="badge badge-category">
              {CATEGORY_LABELS[event.primary_category] || event.primary_category}
            </span>
            <span className={`badge ${getStatusBadgeClass(event.registration_status)}`}>
              {STATUS_LABELS[event.registration_status] || event.registration_status}
            </span>
            <span className="badge badge-mode">
              {event.mode === 'online' ? '🌐 Online' : event.mode === 'hybrid' ? '🔄 Hybrid' : '📍 In-Person'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className={`btn ${isSaved ? 'btn-primary' : 'btn-secondary'} btn-sm`}
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
            <button className="btn btn-secondary btn-sm" onClick={() => downloadICS(event.id)}>
              <Download size={15} /> iCal
            </button>
          </div>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '8px', lineHeight: 1.3 }}>
          {event.title}
        </h1>

        {/* Organizer */}
        {event.organizer && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
            <Building size={16} /> Hosted by <strong style={{ color: 'var(--color-text-primary)' }}>{event.organizer}</strong>
          </div>
        )}

        {/* Countdown Banner */}
        {event.registration_deadline && (
          <div
            style={{
              background: countdown.urgency === 'urgent' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.12)',
              border: `1px solid ${countdown.urgency === 'urgent' ? 'var(--color-status-closing)' : 'var(--color-accent-primary)'}`,
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '28px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Clock size={22} color={countdown.urgency === 'urgent' ? 'var(--color-status-closing)' : 'var(--color-accent-primary)'} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                  {countdown.text}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                  Registration Deadline: {formatDate(event.registration_deadline)}
                </div>
              </div>
            </div>

            {(event.registration_url || event.official_event_url) && (
              <button
                className="btn btn-primary"
                onClick={() => window.open(event.registration_url || event.official_event_url!, '_blank', 'noopener,noreferrer')}
              >
                <ExternalLink size={16} /> Open Registration Portal
              </button>
            )}
          </div>
        )}

        {/* Information Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          <div className="card" style={{ padding: '16px', background: 'var(--color-bg-tertiary)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} /> Conference Dates
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 600 }}>
              {formatDate(event.event_start_at)}
              {event.event_end_at && event.event_end_at !== event.event_start_at && ` — ${formatDate(event.event_end_at)}`}
            </div>
          </div>

          <div className="card" style={{ padding: '16px', background: 'var(--color-bg-tertiary)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} /> Circuit / City
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 600 }}>
              {[event.location_name, event.city, event.country].filter(Boolean).join(', ') || 'Online'}
            </div>
          </div>

          <div className="card" style={{ padding: '16px', background: 'var(--color-bg-tertiary)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign size={14} /> Registration Fee
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 600 }}>
              {event.fee_status === 'free' ? 'Free / No Fee' :
                event.fee_amount ? formatCurrency(event.fee_amount, event.fee_currency) : 'Paid'}
            </div>
          </div>

          <div className="card" style={{ padding: '16px', background: 'var(--color-bg-tertiary)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={14} /> Format & Team Size
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 600, textTransform: 'capitalize' }}>
              {event.participation_type} {event.max_team_size ? `(Max ${event.max_team_size})` : ''}
            </div>
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
              Overview & Competition Rules
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
              {event.description}
            </p>
          </div>
        )}

        {/* Committees */}
        {event.committees && event.committees.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '10px' }}>
              Committees & Agendas
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {event.committees.map((comm, idx) => (
                <span key={idx} className="badge badge-category" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                  {comm}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Awards */}
        {event.awards && (
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={18} color="var(--color-status-closing)" /> Awards & Cash Prizes
            </h2>
            <div style={{ background: 'var(--color-bg-tertiary)', padding: '14px 18px', borderRadius: '10px', fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
              {event.awards}
            </div>
          </div>
        )}

        {/* Personal Tracking Module */}
        <div style={{ borderTop: '1px solid var(--color-border-primary)', paddingTop: '24px' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckSquare size={18} color="var(--color-accent-primary)" /> Personal Preparation & Status Tracker
          </h2>

          {/* Status buttons */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-text-tertiary)', marginBottom: '8px' }}>
              Update Current Status:
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(['interested', 'shortlisted', 'planning_to_apply', 'applied', 'registered', 'preparing', 'participated', 'won_award'] as TrackingStatus[]).map((st) => (
                <button
                  key={st}
                  className={`filter-chip btn-sm ${currentStatus === st && isSaved ? 'active' : ''}`}
                  onClick={() => handleStatusChange(st)}
                >
                  {TRACKING_LABELS[st]}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          {isSaved && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                  Delegate Notes & Team Contacts
                </label>
                {!editingNotes && (
                  <button className="btn btn-ghost btn-sm" onClick={() => { setNotes(currentNotes); setEditingNotes(true); }}>
                    <Edit3 size={12} /> Edit
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
                    placeholder="Enter delegate position paper notes, team lineup, or submission reference..."
                  />
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingNotes(false)}>Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={handleSaveNotes}>Save</button>
                  </div>
                </div>
              ) : (
                <div style={{ background: 'var(--color-bg-tertiary)', padding: '12px 16px', borderRadius: '10px', fontSize: '0.85rem', color: currentNotes ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}>
                  {currentNotes || 'No notes added yet. Click edit to record prep tasks or team notes.'}
                </div>
              )}
            </div>
          )}

          {/* Checklist */}
          {isSaved && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginBottom: '8px' }}>
                Preparation Checklist
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                {checklistItems.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleToggleChecklist(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: 'var(--color-bg-tertiary)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.84rem',
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

              <form onSubmit={handleAddChecklist} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="input"
                  placeholder="Add prep task (e.g. Draft opening motion)..."
                  value={newChecklistText}
                  onChange={e => setNewChecklistText(e.target.value)}
                />
                <button type="submit" className="btn btn-secondary btn-sm" disabled={!newChecklistText.trim()}>
                  Add Task
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
