// ============================================================
// Add Event Modal Component
// ============================================================

import { useState } from 'react';
import { X, Plus, Calendar, MapPin, DollarSign, Users, Link as LinkIcon, Building } from 'lucide-react';
import type { EventCategory, EventMode, FeeStatus, ParticipationType } from '../../types';
import { CATEGORY_LABELS } from '../../types';
import { useCreateEvent } from '../../hooks';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddEventModal({ isOpen, onClose }: AddEventModalProps) {
  const createEvent = useCreateEvent();

  const [formData, setFormData] = useState({
    title: '',
    organizer: '',
    primary_category: 'mun' as EventCategory,
    competition_format: '',
    description: '',
    registration_deadline: '',
    event_start_at: '',
    event_end_at: '',
    mode: 'offline' as EventMode,
    city: 'Delhi',
    location_name: '',
    fee_status: 'paid' as FeeStatus,
    fee_amount: '',
    registration_url: '',
    official_event_url: '',
    eligibility_text: '',
    committees: '',
    awards: '',
    participation_type: 'individual' as ParticipationType,
    beginner_friendly: true,
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    createEvent.mutate(
      {
        title: formData.title.trim(),
        organizer: formData.organizer.trim() || undefined,
        primary_category: formData.primary_category,
        competition_format: formData.competition_format.trim() || undefined,
        description: formData.description.trim() || undefined,
        registration_deadline: formData.registration_deadline ? new Date(formData.registration_deadline).toISOString() : null,
        event_start_at: formData.event_start_at ? new Date(formData.event_start_at).toISOString() : null,
        event_end_at: formData.event_end_at ? new Date(formData.event_end_at).toISOString() : null,
        mode: formData.mode,
        city: formData.city.trim() || undefined,
        location_name: formData.location_name.trim() || undefined,
        fee_status: formData.fee_status,
        fee_amount: formData.fee_amount ? parseFloat(formData.fee_amount) : (formData.fee_status === 'free' ? 0 : null),
        fee_currency: 'INR',
        registration_url: formData.registration_url.trim() || undefined,
        official_event_url: formData.official_event_url.trim() || undefined,
        eligibility_text: formData.eligibility_text.trim() || undefined,
        committees: formData.committees ? formData.committees.split(',').map(s => s.trim()).filter(Boolean) : null,
        awards: formData.awards.trim() || undefined,
        participation_type: formData.participation_type,
        beginner_friendly: formData.beginner_friendly,
        registration_status: 'open',
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <div className="side-panel-overlay" style={{ zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        className="card"
        style={{
          width: '90%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border-primary)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          animation: 'slideUp 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--color-border-primary)', paddingBottom: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Add New Event / Competition
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              Add a MUN conference, parliamentary debate, or student opportunity manually
            </p>
          </div>
          <button
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            style={{ borderRadius: '50%' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            {/* Title */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                Event Title *
              </label>
              <input
                type="text"
                required
                className="input"
                placeholder="e.g. Delhi University MUN 2026 or Mukarji Memorial Debate"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {/* Category & Format */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Category *
                </label>
                <select
                  className="input"
                  value={formData.primary_category}
                  onChange={e => setFormData({ ...formData, primary_category: e.target.value as EventCategory })}
                >
                  {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
                    <option key={cat} value={cat}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Organizer / Host
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. St. Stephen's Debating Society"
                  value={formData.organizer}
                  onChange={e => setFormData({ ...formData, organizer: e.target.value })}
                />
              </div>
            </div>

            {/* Dates: Deadline & Event Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Registration Deadline
                </label>
                <input
                  type="datetime-local"
                  className="input"
                  value={formData.registration_deadline}
                  onChange={e => setFormData({ ...formData, registration_deadline: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Event Start Date
                </label>
                <input
                  type="datetime-local"
                  className="input"
                  value={formData.event_start_at}
                  onChange={e => setFormData({ ...formData, event_start_at: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Event End Date
                </label>
                <input
                  type="datetime-local"
                  className="input"
                  value={formData.event_end_at}
                  onChange={e => setFormData({ ...formData, event_end_at: e.target.value })}
                />
              </div>
            </div>

            {/* Mode & Location */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Participation Mode
                </label>
                <select
                  className="input"
                  value={formData.mode}
                  onChange={e => setFormData({ ...formData, mode: e.target.value as EventMode })}
                >
                  <option value="offline">In-Person (Offline)</option>
                  <option value="online">Virtual (Online)</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  City / Circuit
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Delhi, Mumbai, Online"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Venue Name
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. North Campus / Zoom"
                  value={formData.location_name}
                  onChange={e => setFormData({ ...formData, location_name: e.target.value })}
                />
              </div>
            </div>

            {/* Fee */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Fee Status
                </label>
                <select
                  className="input"
                  value={formData.fee_status}
                  onChange={e => setFormData({ ...formData, fee_status: e.target.value as FeeStatus })}
                >
                  <option value="paid">Paid</option>
                  <option value="free">Free / No Fee</option>
                  <option value="scholarship_available">Scholarship Available</option>
                </select>
              </div>

              {formData.fee_status !== 'free' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Fee Amount (INR)
                  </label>
                  <input
                    type="number"
                    className="input"
                    placeholder="e.g. 1800"
                    value={formData.fee_amount}
                    onChange={e => setFormData({ ...formData, fee_amount: e.target.value })}
                  />
                </div>
              )}
            </div>

            {/* Links */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Registration Link (Form / Portal)
                </label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://..."
                  value={formData.registration_url}
                  onChange={e => setFormData({ ...formData, registration_url: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Official Event Website
                </label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://..."
                  value={formData.official_event_url}
                  onChange={e => setFormData({ ...formData, official_event_url: e.target.value })}
                />
              </div>
            </div>

            {/* Description & Eligibility */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                Event Description
              </label>
              <textarea
                className="input"
                rows={3}
                placeholder="Provide briefing details, agenda, rules, or background..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Committees / Agendas */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                Committees / Topics (comma-separated)
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. UNSC, AIPPM, UNHRC, Crisis Chamber"
                value={formData.committees}
                onChange={e => setFormData({ ...formData, committees: e.target.value })}
              />
            </div>

            {/* Awards & Beginner friendly */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px', alignItems: 'center' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Awards / Cash Prizes
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Best Delegate ₹15,000, Best Speaker ₹8,000"
                  value={formData.awards}
                  onChange={e => setFormData({ ...formData, awards: e.target.value })}
                />
              </div>

              <div style={{ paddingTop: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.beginner_friendly}
                    onChange={e => setFormData({ ...formData, beginner_friendly: e.target.checked })}
                    style={{ accentColor: 'var(--color-accent-primary)', width: '16px', height: '16px' }}
                  />
                  Beginner Friendly
                </label>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', borderTop: '1px solid var(--color-border-primary)', paddingTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createEvent.isPending || !formData.title.trim()}
            >
              {createEvent.isPending ? 'Saving...' : 'Add Event to Platform'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
