-- MUN & Debate Central — Database Schema
-- Migration 0001: Initial Schema

-- Sources Registry
CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'mixed' CHECK (category IN ('mun', 'debate', 'student_competition', 'mixed')),
  integration_mode TEXT NOT NULL DEFAULT 'manual' CHECK (integration_mode IN ('api', 'rss', 'structured_page', 'manual', 'unsupported')),
  health TEXT NOT NULL DEFAULT 'manual_only' CHECK (health IN ('healthy', 'delayed', 'failed', 'manual_only')),
  priority INTEGER NOT NULL DEFAULT 5,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_successful_check TEXT,
  last_attempted_check TEXT,
  last_error TEXT,
  events_discovered INTEGER NOT NULL DEFAULT 0,
  events_updated INTEGER NOT NULL DEFAULT 0,
  integration_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Events Table
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  organizer TEXT,
  primary_category TEXT NOT NULL DEFAULT 'other',
  competition_format TEXT,
  description TEXT,
  registration_open_at TEXT,
  registration_deadline TEXT,
  event_start_at TEXT,
  event_end_at TEXT,
  event_timezone TEXT,
  location_name TEXT,
  city TEXT,
  region TEXT,
  country TEXT,
  mode TEXT NOT NULL DEFAULT 'unknown' CHECK (mode IN ('online', 'offline', 'hybrid', 'unknown')),
  eligibility_text TEXT,
  eligibility_categories TEXT DEFAULT '[]', -- JSON array
  fee_amount REAL,
  fee_currency TEXT,
  fee_status TEXT NOT NULL DEFAULT 'unknown' CHECK (fee_status IN ('free', 'paid', 'scholarship_available', 'unknown')),
  registration_status TEXT NOT NULL DEFAULT 'upcoming_unverified',
  registration_url TEXT,
  official_event_url TEXT,
  committees TEXT, -- JSON array
  topics TEXT, -- JSON array
  awards TEXT,
  certificates INTEGER,
  beginner_friendly INTEGER,
  participation_type TEXT NOT NULL DEFAULT 'unknown' CHECK (participation_type IN ('individual', 'team', 'both', 'unknown')),
  max_team_size INTEGER,
  contact_info TEXT,
  is_manually_added INTEGER NOT NULL DEFAULT 0,
  data_confidence TEXT NOT NULL DEFAULT 'low' CHECK (data_confidence IN ('high', 'medium', 'low')),
  needs_review INTEGER NOT NULL DEFAULT 0,
  first_discovered_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Event-Source Mappings
CREATE TABLE IF NOT EXISTS event_source_mappings (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  source_event_id TEXT,
  source_url TEXT,
  field_provenance TEXT, -- JSON object
  first_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(event_id, source_id)
);

-- Saved Events (Personal Tracking)
CREATE TABLE IF NOT EXISTS saved_events (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'interested',
  personal_notes TEXT,
  team_members TEXT,
  preparation_checklist TEXT,
  registration_reference TEXT,
  personal_priority INTEGER NOT NULL DEFAULT 3,
  estimated_cost REAL,
  application_date TEXT,
  outcome TEXT,
  award_details TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(event_id)
);

-- Sync Runs
CREATE TABLE IF NOT EXISTS sync_runs (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at TEXT,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'partial', 'failed')),
  events_discovered INTEGER NOT NULL DEFAULT 0,
  events_created INTEGER NOT NULL DEFAULT 0,
  events_updated INTEGER NOT NULL DEFAULT 0,
  events_skipped INTEGER NOT NULL DEFAULT 0,
  events_need_review INTEGER NOT NULL DEFAULT 0,
  errors TEXT,
  retry_info TEXT
);

-- User Preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id TEXT PRIMARY KEY DEFAULT 'default',
  preferred_categories TEXT DEFAULT '[]', -- JSON array
  preferred_cities TEXT DEFAULT '[]', -- JSON array
  preferred_mode TEXT,
  max_fee REAL,
  preferred_eligibility TEXT,
  min_notice_days INTEGER,
  deadline_windows TEXT DEFAULT '[1, 3, 7, 14]', -- JSON array
  default_sort TEXT DEFAULT 'event_start_at',
  excluded_sources TEXT DEFAULT '[]', -- JSON array
  theme TEXT DEFAULT 'dark',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Duplicate Reviews
CREATE TABLE IF NOT EXISTS duplicate_reviews (
  id TEXT PRIMARY KEY,
  event_id_a TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  event_id_b TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  similarity_score REAL NOT NULL,
  match_fields TEXT NOT NULL DEFAULT '[]', -- JSON array
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'merged', 'not_duplicate', 'skipped')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT,
  UNIQUE(event_id_a, event_id_b)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_category ON events(primary_category);
CREATE INDEX IF NOT EXISTS idx_events_start ON events(event_start_at);
CREATE INDEX IF NOT EXISTS idx_events_deadline ON events(registration_deadline);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(registration_status);
CREATE INDEX IF NOT EXISTS idx_events_mode ON events(mode);
CREATE INDEX IF NOT EXISTS idx_events_city ON events(city);
CREATE INDEX IF NOT EXISTS idx_events_country ON events(country);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_needs_review ON events(needs_review);
CREATE INDEX IF NOT EXISTS idx_event_source_event ON event_source_mappings(event_id);
CREATE INDEX IF NOT EXISTS idx_event_source_source ON event_source_mappings(source_id);
CREATE INDEX IF NOT EXISTS idx_saved_events_event ON saved_events(event_id);
CREATE INDEX IF NOT EXISTS idx_saved_events_status ON saved_events(status);
CREATE INDEX IF NOT EXISTS idx_sync_runs_source ON sync_runs(source_id);
CREATE INDEX IF NOT EXISTS idx_sync_runs_status ON sync_runs(status);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_event ON notifications(event_id);
CREATE INDEX IF NOT EXISTS idx_duplicate_reviews_status ON duplicate_reviews(status);

-- Insert default preferences
INSERT OR IGNORE INTO user_preferences (id, theme) VALUES ('default', 'dark');
