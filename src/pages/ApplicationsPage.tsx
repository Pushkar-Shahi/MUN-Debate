// ============================================================
// Applications Page — Kanban Application Pipeline Tracker
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, ArrowRight, ArrowLeft, Clock, MapPin, ExternalLink,
  CheckCircle, Plus,
} from 'lucide-react';
import { useSavedEvents, useUpdateSavedEvent } from '../hooks';
import type { TrackingStatus } from '../types';
import { CATEGORY_LABELS } from '../types';
import { formatDateShort, getCountdown } from '../utils';

const PIPELINE_COLUMNS: { id: TrackingStatus; label: string; color: string }[] = [
  { id: 'shortlisted', label: 'Shortlisted', color: 'var(--color-text-accent)' },
  { id: 'planning_to_apply', label: 'Planning to Apply', color: 'var(--color-status-closing)' },
  { id: 'applied', label: 'Applied / Submitted', color: 'var(--color-status-upcoming)' },
  { id: 'registered', label: 'Seat Confirmed', color: 'var(--color-status-open)' },
  { id: 'preparing', label: 'Active Preparation', color: 'var(--color-accent-secondary)' },
];

export function ApplicationsPage() {
  const navigate = useNavigate();
  const { data: savedList, isLoading } = useSavedEvents();
  const updateSaved = useUpdateSavedEvent();

  const saved = savedList || [];

  const handleMove = (id: string, currentStatus: TrackingStatus, direction: 'prev' | 'next') => {
    const curIdx = PIPELINE_COLUMNS.findIndex(c => c.id === currentStatus);
    if (curIdx === -1) return;
    const nextIdx = direction === 'next' ? curIdx + 1 : curIdx - 1;
    if (nextIdx >= 0 && nextIdx < PIPELINE_COLUMNS.length) {
      updateSaved.mutate({ id, data: { status: PIPELINE_COLUMNS[nextIdx].id } });
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span className="badge badge-category" style={{ fontSize: '0.74rem' }}>
            <FileText size={12} style={{ marginRight: '4px' }} /> Application Workflow
          </span>
        </div>
        <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
          Application Pipeline & Stages
        </h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
          Kanban board view to track your applications from initial shortlist to preparation
        </p>
      </div>

      {/* Kanban Board Container */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          alignItems: 'start',
        }}
      >
        {PIPELINE_COLUMNS.map((col, colIdx) => {
          const colEvents = saved.filter(s => s.status === col.id);

          return (
            <div
              key={col.id}
              style={{
                background: 'var(--color-bg-secondary)',
                borderRadius: '14px',
                border: '1px solid var(--color-border-primary)',
                padding: '16px',
                minHeight: '400px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Column Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--color-border-primary)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-text-primary)' }}>
                    {col.label}
                  </span>
                </div>
                <span style={{ background: 'var(--color-bg-tertiary)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                  {colEvents.length}
                </span>
              </div>

              {/* Column Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                {colEvents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--color-text-tertiary)', fontSize: '0.8rem', border: '1px dashed var(--color-border-secondary)', borderRadius: '10px' }}>
                    No events in this stage
                  </div>
                ) : (
                  colEvents.map((item) => {
                    const event = item.event;
                    if (!event) return null;
                    const cd = getCountdown(event.registration_deadline);

                    return (
                      <div
                        key={item.id}
                        className="card card-clickable"
                        onClick={() => navigate(`/events/${event.id}`)}
                        style={{
                          background: 'var(--color-bg-card)',
                          border: '1px solid var(--color-border-primary)',
                          borderRadius: '10px',
                          padding: '14px',
                        }}
                      >
                        <span className="badge badge-category" style={{ fontSize: '0.68rem', marginBottom: '6px', display: 'inline-block' }}>
                          {CATEGORY_LABELS[event.primary_category] || event.primary_category}
                        </span>

                        <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '6px', lineHeight: 1.3 }}>
                          {event.title}
                        </h4>

                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
                          {event.organizer}
                        </div>

                        {event.registration_deadline && (
                          <div style={{ fontSize: '0.72rem', color: cd.urgency === 'urgent' ? 'var(--color-error)' : 'var(--color-text-tertiary)', marginBottom: '10px' }}>
                            <Clock size={11} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
                            {cd.text}
                          </div>
                        )}

                        {/* Move Buttons */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderTop: '1px solid var(--color-border-primary)',
                            paddingTop: '8px',
                            marginTop: '8px',
                          }}
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            className="btn btn-ghost btn-sm btn-icon"
                            disabled={colIdx === 0}
                            title="Move to previous stage"
                            onClick={() => handleMove(item.id, col.id, 'prev')}
                            style={{ opacity: colIdx === 0 ? 0.3 : 1 }}
                          >
                            <ArrowLeft size={14} />
                          </button>

                          <span style={{ fontSize: '0.68rem', color: 'var(--color-text-tertiary)' }}>
                            Stage {colIdx + 1}/5
                          </span>

                          <button
                            className="btn btn-ghost btn-sm btn-icon"
                            disabled={colIdx === PIPELINE_COLUMNS.length - 1}
                            title="Move to next stage"
                            onClick={() => handleMove(item.id, col.id, 'next')}
                            style={{ opacity: colIdx === PIPELINE_COLUMNS.length - 1 ? 0.3 : 1 }}
                          >
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
