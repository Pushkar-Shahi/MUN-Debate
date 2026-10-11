// ============================================================
// Completed Page — Past Participations & Trophy Cabinet
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy, Award, Medal, Calendar, MapPin, CheckCircle,
  ExternalLink, Plus,
} from 'lucide-react';
import { useSavedEvents, useUpdateSavedEvent } from '../hooks';
import { CATEGORY_LABELS } from '../types';
import { formatDate } from '../utils';

export function CompletedPage() {
  const navigate = useNavigate();
  const { data: savedList, isLoading } = useSavedEvents();
  const updateSaved = useUpdateSavedEvent();

  const saved = savedList || [];
  const completed = saved.filter(s => s.status === 'participated' || s.status === 'won_award');

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span className="badge badge-category" style={{ fontSize: '0.74rem' }}>
            <Trophy size={12} style={{ marginRight: '4px', color: 'var(--color-status-closing)' }} /> Trophy Cabinet & Archive
          </span>
        </div>
        <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
          Completed Events & Recognition
        </h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
          Log and celebrate your completed conferences, awards won, committee outcomes, and speaker accolades
        </p>
      </div>

      {completed.length === 0 ? (
        <div
          className="card"
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            background: 'var(--color-bg-secondary)',
            borderRadius: '16px',
          }}
        >
          <Trophy size={44} color="var(--color-status-closing)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
            No Completed Events Logged Yet
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', maxWidth: '440px', margin: '0 auto 20px' }}>
            As you attend conferences and debate tournaments, mark their tracking status as "Participated" or "Won Award" to build your portfolio.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/saved')}>
            View Saved Tracker
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
          {completed.map(item => {
            const event = item.event;
            if (!event) return null;
            const wonAward = item.status === 'won_award';

            return (
              <div
                key={item.id}
                className="card"
                style={{
                  background: 'var(--color-bg-secondary)',
                  border: `1px solid ${wonAward ? 'rgba(245, 158, 11, 0.4)' : 'var(--color-border-primary)'}`,
                  borderRadius: '14px',
                  padding: '22px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span className={`badge ${wonAward ? 'badge-closing' : 'badge-open'}`} style={{ fontSize: '0.74rem' }}>
                    {wonAward ? <Trophy size={12} style={{ marginRight: '4px' }} /> : <CheckCircle size={12} style={{ marginRight: '4px' }} />}
                    {wonAward ? 'Award Winner' : 'Participated'}
                  </span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--color-text-tertiary)' }}>
                    {formatDate(event.event_start_at)}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                  {event.title}
                </h3>

                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
                  {event.organizer} • {[event.city, event.country].filter(Boolean).join(', ') || 'Online'}
                </div>

                {/* Award detail or notes */}
                <div style={{ background: 'var(--color-bg-tertiary)', borderRadius: '10px', padding: '12px 14px', fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
                  <strong style={{ color: 'var(--color-text-primary)' }}>Achievement / Outcome: </strong>
                  {item.award_details || item.personal_notes || 'Participated as delegate/debater.'}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate(`/events/${event.id}`)}
                  >
                    View Archive Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
