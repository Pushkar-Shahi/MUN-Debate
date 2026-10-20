// ============================================================
// Event Filters Bar Component
// ============================================================

import { useState, useRef, useEffect } from 'react';
import {
  Search, SlidersHorizontal, X, ArrowUpDown, LayoutGrid, List,
  Calendar, MapPin, Tag, Download, FileSpreadsheet, Check,
  ChevronLeft, ChevronRight, Layers, Flame, Clock, Archive, ShieldCheck,
} from 'lucide-react';
import type { EventCategory, EventFilters, EventMode, RegistrationStatus, FeeStatus } from '../../types';
import { CATEGORY_LABELS, LOCATION_PRESETS } from '../../types';
import { downloadCSV, downloadICS } from '../../services/api';

interface EventFiltersBarProps {
  filters: EventFilters;
  onChange: (filters: EventFilters) => void;
  viewMode: 'grid' | 'compact' | 'table';
  onViewModeChange: (mode: 'grid' | 'compact' | 'table') => void;
  totalCount?: number;
}

const POPULAR_CATEGORIES: { id: EventCategory; label: string }[] = [
  { id: 'mun', label: 'MUN' },
  { id: 'parliamentary_debate', label: 'Parliamentary Debate' },
  { id: 'workshop', label: 'Workshops & Training' },
  { id: 'case_competition', label: 'Case Competitions' },
  { id: 'moot_court', label: 'Moot Courts' },
  { id: 'bp_debate', label: 'BP Debate' },
  { id: 'ap_debate', label: 'AP Debate' },
  { id: 'bootcamp', label: 'Bootcamps' },
  { id: 'quiz_competition', label: 'Quizzes' },
  { id: 'hackathon_policy', label: 'Policy Hackathons' },
  { id: 'youth_parliament', label: 'Youth Parliament' },
  { id: 'public_speaking', label: 'Public Speaking' },
  { id: 'legal_debate', label: 'Legal Debate' },
];

export function EventFiltersBar({
  filters,
  onChange,
  viewMode,
  onViewModeChange,
  totalCount,
}: EventFiltersBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isWrapped, setIsWrapped] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const chipsRef = useRef<HTMLDivElement>(null);

  const checkScroll = () => {
    if (!chipsRef.current || isWrapped) return;
    const { scrollLeft, scrollWidth, clientWidth } = chipsRef.current;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
  };

  useEffect(() => {
    checkScroll();
    const t1 = setTimeout(checkScroll, 80);
    const t2 = setTimeout(checkScroll, 300);
    const el = chipsRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (el) el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [isWrapped]);

  const scrollChips = (direction: 'left' | 'right') => {
    if (!chipsRef.current) return;
    const offset = direction === 'left' ? -280 : 280;
    chipsRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    setTimeout(checkScroll, 320);
  };

  const activeCategory = filters.categories?.[0];
  const activeMode = filters.mode?.[0];
  const activeLocation = filters.locations?.[0];

  const handleCategoryClick = (cat?: EventCategory) => {
    if (!cat) {
      const { categories, ...rest } = filters;
      onChange({ ...rest, page: 1 });
    } else {
      const isAlready = filters.categories?.includes(cat);
      onChange({
        ...filters,
        categories: isAlready ? undefined : [cat],
        page: 1,
      });
    }
  };

  const handleModeClick = (mode?: EventMode) => {
    if (!mode) {
      const { mode: _, ...rest } = filters;
      onChange({ ...rest, page: 1 });
    } else {
      const isAlready = filters.mode?.includes(mode);
      onChange({
        ...filters,
        mode: isAlready ? undefined : [mode],
        page: 1,
      });
    }
  };

  const handleLocationClick = (loc?: string) => {
    if (!loc) {
      const { locations, ...rest } = filters;
      onChange({ ...rest, page: 1 });
    } else {
      const isAlready = filters.locations?.includes(loc);
      onChange({
        ...filters,
        locations: isAlready ? undefined : [loc],
        page: 1,
      });
    }
  };

  const handleReset = () => {
    onChange({ page: 1, limit: filters.limit });
  };

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.categories?.length ||
    filters.mode?.length ||
    filters.locations?.length ||
    filters.registrationStatus?.length ||
    filters.feeStatus?.length ||
    filters.closingWithin
  );

  return (
    <div className="filter-bar-container" style={{ marginBottom: '20px' }}>
      {/* Circuit Feed Scope Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'inline-flex', background: 'var(--color-bg-secondary)', padding: '4px', borderRadius: '10px', border: '1px solid var(--color-border-primary)', gap: '4px' }}>
          <button
            type="button"
            className={`scope-pill ${(filters.scope === 'active' || !filters.scope) ? 'active' : ''}`}
            onClick={() => onChange({ ...filters, scope: 'active', page: 1 })}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '7px',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: (filters.scope === 'active' || !filters.scope) ? 'var(--color-accent-primary)' : 'transparent',
              color: (filters.scope === 'active' || !filters.scope) ? '#ffffff' : 'var(--color-text-secondary)',
              transition: 'all 0.15s ease',
            }}
          >
            <Flame size={14} /> Active & Upcoming
          </button>
          <button
            type="button"
            className={`scope-pill ${filters.scope === 'closing_soon' ? 'active' : ''}`}
            onClick={() => onChange({ ...filters, scope: 'closing_soon', page: 1 })}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '7px',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: filters.scope === 'closing_soon' ? 'var(--color-accent-primary)' : 'transparent',
              color: filters.scope === 'closing_soon' ? '#ffffff' : 'var(--color-text-secondary)',
              transition: 'all 0.15s ease',
            }}
          >
            <Clock size={14} /> Closing This Week
          </button>
          <button
            type="button"
            className={`scope-pill ${filters.scope === 'archived' ? 'active' : ''}`}
            onClick={() => onChange({ ...filters, scope: 'archived', page: 1 })}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '7px',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: filters.scope === 'archived' ? 'var(--color-accent-primary)' : 'transparent',
              color: filters.scope === 'archived' ? '#ffffff' : 'var(--color-text-secondary)',
              transition: 'all 0.15s ease',
            }}
          >
            <Archive size={14} /> Past & Concluded
          </button>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--color-text-secondary)', background: 'var(--color-bg-secondary)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--color-border-primary)' }}>
          <ShieldCheck size={14} color="#10b981" />
          <span>Automated Verification Active • Expired Items Filtered</span>
        </div>
      </div>

      {/* Search and Top Controls */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '14px' }}>
        <div style={{ position: 'relative', flex: '1 1 300px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
          <input
            type="text"
            className="input"
            style={{ paddingLeft: '36px', width: '100%' }}
            placeholder="Search title, organizer, city, topic..."
            value={filters.search || ''}
            onChange={(e) => onChange({ ...filters, search: e.target.value || undefined, page: 1 })}
          />
          {filters.search && (
            <button
              onClick={() => onChange({ ...filters, search: undefined, page: 1 })}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowUpDown size={15} color="var(--color-text-secondary)" />
          <select
            className="input"
            style={{ width: 'auto', padding: '8px 12px', fontSize: '0.82rem' }}
            value={filters.sortBy || 'registration_deadline'}
            onChange={(e) => onChange({ ...filters, sortBy: e.target.value })}
          >
            <option value="registration_deadline">Deadline (Earliest)</option>
            <option value="event_start_at">Event Date (Soonest)</option>
            <option value="title">Title (A - Z)</option>
            <option value="created_at">Newly Discovered</option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div style={{ display: 'flex', background: 'var(--color-bg-tertiary)', padding: '2px', borderRadius: '8px', border: '1px solid var(--color-border-primary)' }}>
          <button
            className={`btn-icon btn-sm ${viewMode === 'grid' ? 'active-view' : ''}`}
            onClick={() => onViewModeChange('grid')}
            title="Grid View"
            style={{ background: viewMode === 'grid' ? 'var(--color-accent-primary)' : 'transparent', color: viewMode === 'grid' ? '#fff' : 'var(--color-text-secondary)', border: 'none', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer' }}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            className={`btn-icon btn-sm ${viewMode === 'compact' ? 'active-view' : ''}`}
            onClick={() => onViewModeChange('compact')}
            title="Compact View"
            style={{ background: viewMode === 'compact' ? 'var(--color-accent-primary)' : 'transparent', color: viewMode === 'compact' ? '#fff' : 'var(--color-text-secondary)', border: 'none', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer' }}
          >
            <List size={16} />
          </button>
        </div>

        {/* Filter Details Toggle */}
        <button
          className={`btn btn-sm ${showAdvanced ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <SlidersHorizontal size={14} /> Filters
          {hasActiveFilters && (
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-accent-primary)', marginLeft: '4px' }} />
          )}
        </button>

        {/* Multi-line Wrap Toggle */}
        <button
          type="button"
          className={`btn btn-sm ${isWrapped ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => {
            setIsWrapped(!isWrapped);
            setTimeout(checkScroll, 120);
          }}
          title={isWrapped ? 'Switch back to single scrolling row' : 'Wrap all categories onto multiple lines'}
        >
          <Layers size={14} /> {isWrapped ? 'Row View' : 'All Categories'}
        </button>

        {/* Export Dropdown */}
        <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => downloadCSV('events')}
            title="Export all events to CSV"
          >
            <FileSpreadsheet size={14} /> Export CSV
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => downloadICS()}
            title="Export calendar feed to iCalendar (ICS)"
          >
            <Download size={14} /> Add to Calendar
          </button>
        </div>
      </div>

      {/* Category Filter Chips Carousel */}
      <div className="filter-chips-carousel">
        {!isWrapped && canScrollLeft && (
          <div className="chip-nav-overlay left">
            <button
              type="button"
              className="chip-nav-btn"
              onClick={() => scrollChips('left')}
              title="Scroll categories left"
              aria-label="Scroll left"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        )}

        <div
          ref={chipsRef}
          className={`filter-chips-track ${isWrapped ? 'is-wrapped' : ''}`}
        >
          <button
            type="button"
            className={`filter-chip ${!activeCategory ? 'active' : ''}`}
            onClick={() => handleCategoryClick(undefined)}
          >
            All Categories
          </button>
          {POPULAR_CATEGORIES.map((cat) => (
            <button
              type="button"
              key={cat.id}
              className={`filter-chip ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => handleCategoryClick(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {!isWrapped && canScrollRight && (
          <div className="chip-nav-overlay right">
            <button
              type="button"
              className="chip-nav-btn"
              onClick={() => scrollChips('right')}
              title="Scroll categories right"
              aria-label="Scroll right"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Advanced Filter Drawdown */}
      {showAdvanced && (
        <div
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-primary)',
            borderRadius: '12px',
            padding: '16px 20px',
            marginTop: '12px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {/* Category Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                All Categories & Formats
              </label>
              <select
                className="input"
                style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                value={activeCategory || ''}
                onChange={(e) => handleCategoryClick((e.target.value as EventCategory) || undefined)}
              >
                <option value="">All Categories & Formats</option>
                {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
                  <option key={cat} value={cat}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Mode Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                Mode of Participation
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {(['online', 'offline', 'hybrid'] as EventMode[]).map((m) => (
                  <button
                    key={m}
                    className={`filter-chip btn-sm ${activeMode === m ? 'active' : ''}`}
                    onClick={() => handleModeClick(m)}
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  >
                    {m === 'online' ? '🌐 Online' : m === 'offline' ? '📍 In-Person' : '🔄 Hybrid'}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                Target Location / Circuit
              </label>
              <select
                className="input"
                style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                value={activeLocation || ''}
                onChange={(e) => handleLocationClick(e.target.value || undefined)}
              >
                <option value="">Any Location</option>
                {LOCATION_PRESETS.map((loc) => (
                  <option key={loc.value} value={loc.value}>
                    {loc.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Registration Status */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                Registration Status
              </label>
              <select
                className="input"
                style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                value={filters.registrationStatus?.[0] || ''}
                onChange={(e) => {
                  const val = e.target.value as RegistrationStatus;
                  onChange({ ...filters, registrationStatus: val ? [val] : undefined, page: 1 });
                }}
              >
                <option value="">All Statuses</option>
                <option value="open">Registration Open</option>
                <option value="closing_soon">Closing Soon</option>
                <option value="opening_soon">Opening Soon</option>
              </select>
            </div>

            {/* Fee Status */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                Entry Fee
              </label>
              <select
                className="input"
                style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                value={filters.feeStatus?.[0] || ''}
                onChange={(e) => {
                  const val = e.target.value as FeeStatus;
                  onChange({ ...filters, feeStatus: val ? [val] : undefined, page: 1 });
                }}
              >
                <option value="">All Fees</option>
                <option value="free">Free / No Registration Fee</option>
                <option value="scholarship_available">Scholarship Available</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            {/* Closing Window */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                Closing Window
              </label>
              <select
                className="input"
                style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                value={filters.closingWithin || ''}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value) : undefined;
                  onChange({ ...filters, closingWithin: val, page: 1 });
                }}
              >
                <option value="">Any Time</option>
                <option value="1">Closing within 24 Hours</option>
                <option value="3">Closing within 3 Days</option>
                <option value="7">Closing within 7 Days</option>
                <option value="14">Closing within 14 Days</option>
              </select>
            </div>
          </div>

          {/* Active Filter Clear Bar */}
          {hasActiveFilters && (
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--color-border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                {totalCount !== undefined ? `Showing ${totalCount} matching opportunities` : 'Filtered results'}
              </span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleReset}
                style={{ fontSize: '0.78rem', color: 'var(--color-status-closing)' }}
              >
                <X size={13} /> Reset All Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
