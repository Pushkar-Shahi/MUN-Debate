// ============================================================
// Sources Page — Ingestion Pipeline & Scraper Health
// ============================================================

import { useState } from 'react';
import {
  Database, RefreshCw, ExternalLink, ShieldCheck, AlertTriangle,
  Clock, CheckCircle, Plus, Activity, X,
} from 'lucide-react';
import { useSources, useCreateSource, useTriggerSync } from '../hooks';
import type { Source, SourceCategory, IntegrationMode } from '../types';
import { formatDate, formatRelative, getHealthDotClass } from '../utils';

export function SourcesPage() {
  const { data: sources, isLoading } = useSources();
  const createSource = useCreateSource();
  const triggerSync = useTriggerSync();

  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newSource, setNewSource] = useState({
    name: '',
    url: '',
    category: 'mun' as SourceCategory,
    integration_mode: 'structured_page' as IntegrationMode,
    integration_notes: '',
  });

  const sourceList = sources || [];

  const handleSync = async (id: string) => {
    setSyncingId(id);
    try {
      await triggerSync.mutateAsync(id);
    } finally {
      setTimeout(() => setSyncingId(null), 1000);
    }
  };

  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSource.name.trim() || !newSource.url.trim()) return;
    createSource.mutate(
      {
        name: newSource.name.trim(),
        url: newSource.url.trim(),
        category: newSource.category,
        integration_mode: newSource.integration_mode,
        integration_notes: newSource.integration_notes.trim() || undefined,
        priority: 2,
      },
      {
        onSuccess: () => {
          setModalOpen(false);
          setNewSource({ name: '', url: '', category: 'mun', integration_mode: 'structured_page', integration_notes: '' });
        },
      }
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-category" style={{ fontSize: '0.74rem' }}>
              <Database size={12} style={{ marginRight: '4px' }} /> Ingestion Pipeline Engine
            </span>
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            Data Sources & Crawler Health
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Live status of automated crawlers, structured page adapters, and community discovery channels
          </p>
        </div>

        <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Add Custom Source
        </button>
      </div>

      {/* Sources Health Summary Rail */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '16px', background: 'var(--color-bg-secondary)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Total Active Sources</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{sourceList.length}</div>
        </div>
        <div className="card" style={{ padding: '16px', background: 'var(--color-bg-secondary)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-status-open)', marginBottom: '4px' }}>Healthy Adapters</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-status-open)' }}>
            {sourceList.filter(s => s.health === 'healthy').length}
          </div>
        </div>
        <div className="card" style={{ padding: '16px', background: 'var(--color-bg-secondary)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Total Events Discovered</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-accent-primary)' }}>
            {sourceList.reduce((acc, s) => acc + (s.events_discovered || 0), 0)}
          </div>
        </div>
        <div className="card" style={{ padding: '16px', background: 'var(--color-bg-secondary)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Cron Frequency</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Every 6 Hours</div>
        </div>
      </div>

      {/* Source Cards Grid */}
      {isLoading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
          Loading ingestion sources...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
          {sourceList.map(src => {
            const isSyncing = syncingId === src.id;

            return (
              <div
                key={src.id}
                className="card"
                style={{
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border-primary)',
                  borderRadius: '14px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`health-dot ${getHealthDotClass(src.health)}`} />
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {src.name}
                      </h3>
                    </div>
                    <span className="badge badge-category" style={{ fontSize: '0.68rem', textTransform: 'capitalize' }}>
                      {src.category.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.78rem', color: 'var(--color-text-accent)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '12px', wordBreak: 'break-all' }}
                  >
                    {src.url} <ExternalLink size={12} />
                  </a>

                  {src.integration_notes && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '16px', background: 'var(--color-bg-tertiary)', padding: '10px 12px', borderRadius: '8px' }}>
                      {src.integration_notes}
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.76rem', color: 'var(--color-text-secondary)', marginBottom: '16px', borderTop: '1px solid var(--color-border-primary)', paddingTop: '12px' }}>
                    <div>
                      <span style={{ color: 'var(--color-text-tertiary)', display: 'block' }}>Integration Mode:</span>
                      <strong style={{ color: 'var(--color-text-primary)' }}>{src.integration_mode.replace(/_/g, ' ').toUpperCase()}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-tertiary)', display: 'block' }}>Discovered:</span>
                      <strong style={{ color: 'var(--color-text-primary)' }}>{src.events_discovered} events</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-tertiary)', display: 'block' }}>Last Check:</span>
                      <span>{src.last_successful_check ? formatRelative(src.last_successful_check) : 'Manual only'}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-tertiary)', display: 'block' }}>Health:</span>
                      <span style={{ textTransform: 'capitalize', color: src.health === 'healthy' ? 'var(--color-status-open)' : 'var(--color-text-secondary)' }}>
                        {src.health.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleSync(src.id)}
                      disabled={isSyncing}
                      style={{ fontSize: '0.78rem' }}
                    >
                      <RefreshCw size={13} className={isSyncing ? 'spin-animation' : ''} />
                      {isSyncing ? 'Syncing...' : 'Sync Source Now'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Custom Source Modal */}
      {modalOpen && (
        <div className="side-panel-overlay" style={{ zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            className="card"
            style={{
              width: '90%',
              maxWidth: '520px',
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border-primary)',
              borderRadius: '16px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Add Ingestion Source</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSource}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>Source Name *</label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="e.g. Cambridge Inter-Collegiate Debate Circuit"
                    value={newSource.name}
                    onChange={e => setNewSource({ ...newSource, name: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>Website URL *</label>
                  <input
                    type="url"
                    required
                    className="input"
                    placeholder="https://..."
                    value={newSource.url}
                    onChange={e => setNewSource({ ...newSource, url: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>Category</label>
                    <select
                      className="input"
                      value={newSource.category}
                      onChange={e => setNewSource({ ...newSource, category: e.target.value as SourceCategory })}
                    >
                      <option value="mun">Model UN</option>
                      <option value="debate">Debate</option>
                      <option value="student_competition">Student Competition</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>Adapter Mode</label>
                    <select
                      className="input"
                      value={newSource.integration_mode}
                      onChange={e => setNewSource({ ...newSource, integration_mode: e.target.value as IntegrationMode })}
                    >
                      <option value="structured_page">Structured Page Parser</option>
                      <option value="api">API Endpoint</option>
                      <option value="rss">RSS / Atom Feed</option>
                      <option value="manual">Manual Monitoring</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>Integration Notes</label>
                  <textarea
                    className="input"
                    rows={2}
                    placeholder="Notes on schedule, frequency, or scraper parameters..."
                    value={newSource.integration_notes}
                    onChange={e => setNewSource({ ...newSource, integration_notes: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Register Source</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
