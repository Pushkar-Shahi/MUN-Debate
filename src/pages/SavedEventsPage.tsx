// ============================================================
// Saved Events Page — Personal Opportunity Tracker
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bookmark, CheckSquare, Clock, MapPin, ExternalLink, Trash2,
  FileSpreadsheet, Download, Calendar, DollarSign, Edit3, Plus,
} from 'lucide-react';
import { useSavedEvents, useUpdateSavedEvent, useDeleteSavedEvent } from '../hooks';
import type { TrackingStatus } from '../types';
import { TRACKING_LABELS, CATEGORY_LABELS } from '../types';
import { formatDate, getCountdown, formatCurrency } from '../utils';
import { downloadCSV, downloadICS } from '../services/api';

export function SavedEventsPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { data: savedList, isLoading } = useSavedEvents(statusFilter === 'all' ? undefined : statusFilter);
  const updateSaved = useUpdateSavedEvent();
  const deleteSaved = useDeleteSavedEvent();

  const saved = savedList || [];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-category" style={{ fontSize: '0.74rem' }}>
              <Bookmark size={12} style={{ marginRight: '4px' }} /> Personal Tracking Hub
            </span>
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            Saved Opportunities & Applications
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Track and manage your shortlisted conferences, application deadlines, delegate prep, and team entries
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => downloadCSV('saved')}>
            <FileSpreadsheet size={14} /> Export Saved CSV
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => downloadICS(undefined, true)}>
            <Download size={14} /> Export My Calendar
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '22px', borderBottom: '1px solid var(--color-border-primary)', paddingBottom: '12px', overflowX: 'auto' }}>
        {[
          { key: 'all', label: 'All Saved' },
          { key: 'shortlisted', label: 'Shortlisted' },
          { key: 'planning_to_apply', label: 'Planning to Apply' },
          { key: 'applied', label: 'Applied' },
          { key: 'registered', label: 'Registered' },
          { key: 'preparing', label: 'Preparing' },
        ].map(tab => (
          <button
            key={tab.key}
            className={`filter-chip ${statusFilter === tab.key ? 'active' : ''}`}
            onClick={() => setStatusFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
          Loading saved events...
        </div>
      ) : saved.length === 0 ? (
        <div
          className="card"
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            background: 'var(--color-bg-secondary)',
            borderRadius: '16px',
          }}
        >
          <Bookmark size={40} color="var(--color-text-tertiary)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
            No Saved Events Found
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', maxWidth: '440px', margin: '0 auto 20px' }}>
            Bookmark upcoming conferences and tournaments from the directory to track your application pipeline.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/events')}>
            Browse Events Directory
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {saved.map(item => {
            const event = item.event;
            if (!event) return null;
            const cd = getCountdown(event.registration_deadline);

            let checklist: { text: string; done: boolean }[] = [];
            try {
              if (item.preparation_checklist) checklist = JSON.parse(item.preparation_checklist);
            } catch {
              checklist = [];
            }
            const completedCount = checklist.filter(c => c.done).length;

            return (
              <div
                key={item.id}
                className="card card-clickable"
                onClick={() => navigate(`/events/${event.id}`)}
                style={{
                  background: 'var(--color-bg-secondary)',
                  padding: '22px 24px',
                  borderRadius: '14px',
                  border: '1px solid var(--color-border-primary)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
                  <div style={{ flex: '1 1 360px' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                      <span className="badge badge-category" style={{ fontSize: '0.72rem' }}>
                        {CATEGORY_LABELS[event.primary_category] || event.primary_category}
                      </span>
                      <span className="badge badge-mode" style={{ fontSize: '0.72rem' }}>
                        {event.mode === 'online' ? '🌐 Online' : '📍 In-Person'}
                      </span>
                      {item.registration_reference && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                          Ref: {item.registration_reference}
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                      {event.title}
                    </h3>

                    <div style={{ display: 'flex', gap: '14px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
                      {event.organizer && <span>Host: {event.organizer}</span>}
                      {(event.city || event.country) && (
                        <span><MapPin size={13} style={{ verticalAlign: 'middle', marginRight: '3px' }} />{[event.city, event.country].filter(Boolean).join(', ')}</span>
                      )}
                      {event.registration_deadline && (
                        <span>Deadline: {formatDate(event.registration_deadline)}</span>
                      )}
                    </div>
                  </div>

                  {/* Status Picker Dropdown */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} onClick={e => e.stopPropagation()}>
                    <select
                      className="input"
                      style={{ fontSize: '0.8rem', padding: '6px 12px', fontWeight: 600, background: 'var(--color-bg-tertiary)' }}
                      value={item.status}
                      onChange={e => updateSaved.mutate({ id: item.id, data: { status: e.target.value as TrackingStatus } })}
                    >
                      {Object.entries(TRACKING_LABELS).map(([k, lbl]) => (
                        <option key={k} value={k}>{lbl}</option>
                      ))}
                    </select>

                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      title="Remove from saved"
                      onClick={() => deleteSaved.mutate(item.id)}
                    >
                      <Trash2 size={16} color="var(--color-error)" />
                    </button>
                  </div>
                </div>

                {/* Personal Notes & Checklist Summary */}
                <div style={{ background: 'var(--color-bg-tertiary)', borderRadius: '10px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', flex: '1 1 300px' }}>
                    <strong style={{ color: 'var(--color-text-primary)' }}>Notes: </strong>
                    {item.personal_notes || 'No notes added yet. Click on event to record strategy.'}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {checklist.length > 0 && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                        <CheckSquare size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                        {completedCount}/{checklist.length} Tasks Complete
                      </span>
                    )}

                    {(event.registration_url || event.official_event_url) && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(event.registration_url || event.official_event_url!, '_blank', 'noopener,noreferrer');
                        }}
                      >
                        <ExternalLink size={13} /> Open Portal
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
