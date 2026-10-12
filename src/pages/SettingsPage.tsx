// ============================================================
// Settings Page — User Preferences & Discovery Configuration
// ============================================================

import { useState, useEffect } from 'react';
import {
  Settings, Save, MapPin, Check, Sun, Moon,
} from 'lucide-react';
import { usePreferences, useUpdatePreferences } from '../hooks';
import { useTheme } from '../context/ThemeContext';
import type { EventCategory, EventMode, EligibilityCategory } from '../types';
import { CATEGORY_LABELS, LOCATION_PRESETS } from '../types';

export function SettingsPage() {
  const { data: prefs, isLoading } = usePreferences();
  const updatePrefs = useUpdatePreferences();
  const { theme, setTheme } = useTheme();

  const [formData, setFormData] = useState({
    preferred_categories: [] as EventCategory[],
    preferred_cities: [] as string[],
    preferred_mode: null as EventMode | null,
    max_fee: 5000,
    preferred_eligibility: 'undergraduate' as EligibilityCategory | null,
    min_notice_days: 7,
    theme: 'dark' as 'dark' | 'light',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (prefs) {
      setFormData({
        preferred_categories: prefs.preferred_categories || [],
        preferred_cities: prefs.preferred_cities || [],
        preferred_mode: prefs.preferred_mode || null,
        max_fee: prefs.max_fee ?? 5000,
        preferred_eligibility: prefs.preferred_eligibility || null,
        min_notice_days: prefs.min_notice_days ?? 7,
        theme: prefs.theme || 'dark',
      });
    }
  }, [prefs]);

  const toggleCategory = (cat: EventCategory) => {
    const list = formData.preferred_categories.includes(cat)
      ? formData.preferred_categories.filter(c => c !== cat)
      : [...formData.preferred_categories, cat];
    setFormData({ ...formData, preferred_categories: list });
  };

  const toggleCity = (city: string) => {
    const list = formData.preferred_cities.includes(city)
      ? formData.preferred_cities.filter(c => c !== city)
      : [...formData.preferred_cities, city];
    setFormData({ ...formData, preferred_cities: list });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePrefs.mutate(formData, {
      onSuccess: () => {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      },
    });
  };

  return (
    <div style={{ maxWidth: '840px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span className="badge badge-category" style={{ fontSize: '0.74rem' }}>
            <Settings size={12} style={{ marginRight: '4px' }} /> Preferences & Discovery Config
          </span>
        </div>
        <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
          Settings & Discovery Filters
        </h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
          Tailor notifications, circuit locations, fee budgets, and favored debate formats for your personal circuit
        </p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        {/* Preferred Categories */}
        <div className="card" style={{ padding: '24px', background: 'var(--color-bg-secondary)', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
            Preferred Competition Formats
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
            Selected categories will be prioritized in discovery notifications and recommendations
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
              const isSelected = formData.preferred_categories.includes(cat as EventCategory);
              return (
                <button
                  type="button"
                  key={cat}
                  className={`filter-chip ${isSelected ? 'active' : ''}`}
                  onClick={() => toggleCategory(cat as EventCategory)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Target Cities & Circuits */}
        <div className="card" style={{ padding: '24px', background: 'var(--color-bg-secondary)', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
            Target Circuits & Geographies
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
            Filter conferences and in-person tournaments based on your travel range
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {LOCATION_PRESETS.map((loc) => {
              const isSelected = formData.preferred_cities.includes(loc.label);
              return (
                <button
                  type="button"
                  key={loc.value}
                  className={`filter-chip ${isSelected ? 'active' : ''}`}
                  onClick={() => toggleCity(loc.label)}
                >
                  <MapPin size={12} style={{ marginRight: '4px' }} /> {loc.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Appearance & Theme */}
        <div className="card" style={{ padding: '24px', background: 'var(--color-bg-secondary)', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
            Appearance & Theme
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
            Select your preferred display theme. Easily switch any time using the header toggle.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div
              className="card card-clickable"
              onClick={() => {
                setTheme('dark');
                setFormData({ ...formData, theme: 'dark' });
              }}
              style={{
                background: theme === 'dark' ? 'rgba(99, 102, 241, 0.12)' : 'var(--color-bg-tertiary)',
                borderColor: theme === 'dark' ? 'var(--color-accent-primary)' : 'var(--color-border-primary)',
                padding: '16px 20px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                cursor: 'pointer',
              }}
            >
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#0f0f12', border: '1px solid #2a2a36', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Moon size={20} color="#818cf8" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-text-primary)' }}>
                  Dark Mode
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)' }}>
                  Deep slate & OLED contrast
                </div>
              </div>
              {theme === 'dark' && (
                <Check size={18} color="var(--color-accent-primary)" style={{ marginLeft: 'auto' }} />
              )}
            </div>

            <div
              className="card card-clickable"
              onClick={() => {
                setTheme('light');
                setFormData({ ...formData, theme: 'light' });
              }}
              style={{
                background: theme === 'light' ? 'rgba(79, 70, 229, 0.08)' : 'var(--color-bg-tertiary)',
                borderColor: theme === 'light' ? 'var(--color-accent-primary)' : 'var(--color-border-primary)',
                padding: '16px 20px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                cursor: 'pointer',
              }}
            >
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ffffff', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sun size={20} color="#f59e0b" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-text-primary)' }}>
                  Light Mode
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)' }}>
                  Crisp clean high contrast
                </div>
              </div>
              {theme === 'light' && (
                <Check size={18} color="var(--color-accent-primary)" style={{ marginLeft: 'auto' }} />
              )}
            </div>
          </div>
        </div>

        {/* Budget & Notice Period */}
        <div className="card" style={{ padding: '24px', background: 'var(--color-bg-secondary)', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
            Budget & Notice Period
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginBottom: '18px' }}>
            Set maximum delegation fee thresholds and minimum deadline warnings
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                Max Delegate Fee: ₹{formData.max_fee}
              </label>
              <input
                type="range"
                min="0"
                max="10000"
                step="500"
                style={{ width: '100%', accentColor: 'var(--color-accent-primary)' }}
                value={formData.max_fee}
                onChange={e => setFormData({ ...formData, max_fee: parseInt(e.target.value) })}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                <span>Free (₹0)</span>
                <span>₹5,000</span>
                <span>₹10,000+</span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                Minimum Deadline Alert Window
              </label>
              <select
                className="form-select"
                value={formData.min_notice_days}
                onChange={e => setFormData({ ...formData, min_notice_days: parseInt(e.target.value) })}
              >
                <option value={3}>3 Days in advance</option>
                <option value={7}>7 Days in advance (Recommended)</option>
                <option value={14}>14 Days in advance</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
          {savedSuccess && (
            <span style={{ fontSize: '0.82rem', color: 'var(--color-status-open)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Check size={16} /> Preferences updated successfully!
            </span>
          )}
          <button type="submit" className="btn btn-primary" disabled={updatePrefs.isPending}>
            <Save size={16} /> {updatePrefs.isPending ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
  );
}
