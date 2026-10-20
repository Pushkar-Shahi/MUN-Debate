// ============================================================
// MUN & Debate Central — Core Type Definitions
// ============================================================

// --- Event Categories & Formats ---

export type EventCategory =
  | 'mun'
  | 'parliamentary_debate'
  | 'bp_debate'
  | 'ap_debate'
  | 'world_schools_debate'
  | 'public_forum_debate'
  | 'ld_debate'
  | 'policy_debate'
  | 'public_speaking'
  | 'extempore'
  | 'youth_parliament'
  | 'legal_debate'
  | 'policy_diplomacy'
  | 'online_debate_tournament'
  | 'workshop'
  | 'bootcamp'
  | 'case_competition'
  | 'moot_court'
  | 'quiz_competition'
  | 'hackathon_policy'
  | 'other';

export type EventMode = 'online' | 'offline' | 'hybrid' | 'unknown';

export type RegistrationStatus =
  | 'open'
  | 'opening_soon'
  | 'closing_soon'
  | 'closed'
  | 'upcoming_unverified'
  | 'postponed'
  | 'cancelled'
  | 'completed';

export type FeeStatus = 'free' | 'paid' | 'scholarship_available' | 'unknown';

export type EligibilityCategory =
  | 'school'
  | 'undergraduate'
  | 'college'
  | 'university'
  | 'open'
  | 'restricted'
  | 'unknown';

export type ParticipationType = 'individual' | 'team' | 'both' | 'unknown';

// --- Source Types ---

export type SourceCategory = 'mun' | 'debate' | 'student_competition' | 'workshop' | 'mixed';

export type IntegrationMode =
  | 'api'
  | 'rss'
  | 'structured_page'
  | 'manual'
  | 'unsupported';

export type SourceHealth = 'healthy' | 'delayed' | 'failed' | 'manual_only';

export interface Source {
  id: string;
  name: string;
  url: string;
  category: SourceCategory;
  integration_mode: IntegrationMode;
  health: SourceHealth;
  priority: number;
  is_active: boolean;
  last_successful_check: string | null;
  last_attempted_check: string | null;
  last_error: string | null;
  events_discovered: number;
  events_updated: number;
  integration_notes: string | null;
  created_at: string;
  updated_at: string;
}

// --- Event Types ---

export interface EventRecord {
  id: string;
  title: string;
  slug: string;
  organizer: string | null;
  primary_category: EventCategory;
  competition_format: string | null;
  description: string | null;
  registration_open_at: string | null;
  registration_deadline: string | null;
  event_start_at: string | null;
  event_end_at: string | null;
  event_timezone: string | null;
  location_name: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  mode: EventMode;
  eligibility_text: string | null;
  eligibility_categories: EligibilityCategory[];
  fee_amount: number | null;
  fee_currency: string | null;
  fee_status: FeeStatus;
  registration_status: RegistrationStatus;
  registration_url: string | null;
  official_event_url: string | null;
  committees: string[] | null;
  topics: string[] | null;
  awards: string | null;
  certificates: boolean | null;
  beginner_friendly: boolean | null;
  participation_type: ParticipationType;
  max_team_size: number | null;
  contact_info: string | null;
  is_manually_added: boolean;
  data_confidence: 'high' | 'medium' | 'low';
  needs_review: boolean;
  first_discovered_at: string;
  last_seen_at: string;
  last_verified_at: string | null;
  saved_status?: string;
  saved_id?: string;
  created_at: string;
  updated_at: string;
}

// --- Event-Source Mapping ---

export interface EventSourceMapping {
  id: string;
  event_id: string;
  source_id: string;
  source_event_id: string | null;
  source_url: string | null;
  field_provenance: Record<string, string> | null;
  first_seen_at: string;
  last_seen_at: string;
}

// --- Personal Tracking ---

export type TrackingStatus =
  | 'interested'
  | 'shortlisted'
  | 'planning_to_apply'
  | 'applied'
  | 'registered'
  | 'preparing'
  | 'participated'
  | 'won_award'
  | 'not_participating';

export interface SavedEvent {
  id: string;
  event_id: string;
  status: TrackingStatus;
  personal_notes: string | null;
  team_members: string | null;
  preparation_checklist: string | null;
  registration_reference: string | null;
  personal_priority: number;
  estimated_cost: number | null;
  application_date: string | null;
  outcome: string | null;
  award_details: string | null;
  created_at: string;
  updated_at: string;
  event?: EventRecord; // joined
}

// --- Sync Runs ---

export type SyncStatus = 'running' | 'success' | 'partial' | 'failed';

export interface SyncRun {
  id: string;
  source_id: string;
  started_at: string;
  ended_at: string | null;
  status: SyncStatus;
  events_discovered: number;
  events_created: number;
  events_updated: number;
  events_skipped: number;
  events_need_review: number;
  errors: string | null;
  retry_info: string | null;
}

// --- User Preferences ---

export interface UserPreferences {
  id: string;
  preferred_categories: EventCategory[];
  preferred_cities: string[];
  preferred_mode: EventMode | null;
  max_fee: number | null;
  preferred_eligibility: EligibilityCategory | null;
  min_notice_days: number | null;
  deadline_windows: number[];
  default_sort: string;
  excluded_sources: string[];
  theme: 'dark' | 'light';
  created_at: string;
  updated_at: string;
}

// --- Notifications ---

export type NotificationType =
  | 'deadline_24h'
  | 'deadline_3d'
  | 'deadline_7d'
  | 'event_change'
  | 'registration_change'
  | 'new_event';

export interface Notification {
  id: string;
  event_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  event?: EventRecord;
}

// --- Duplicate Review ---

export interface DuplicateReview {
  id: string;
  event_id_a: string;
  event_id_b: string;
  similarity_score: number;
  match_fields: string[];
  status: 'pending' | 'merged' | 'not_duplicate' | 'skipped';
  created_at: string;
  resolved_at: string | null;
}

// --- Filter Types ---

export interface EventFilters {
  search?: string;
  categories?: EventCategory[];
  dateRange?: {
    start: string;
    end: string;
  };
  datePreset?: 'today' | 'week' | 'month' | 'this_month' | 'next_month';
  locations?: string[];
  mode?: EventMode[];
  eligibility?: EligibilityCategory[];
  feeStatus?: FeeStatus[];
  registrationStatus?: RegistrationStatus[];
  sources?: string[];
  participationType?: ParticipationType[];
  beginnerFriendly?: boolean;
  hasDeadline?: boolean;
  closingWithin?: number; // days
  savedOnly?: boolean;
  scope?: 'active' | 'closing_soon' | 'archived' | 'all';
  includeClosed?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// --- API Response Types ---

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// --- Dashboard Stats ---

export interface DashboardStats {
  upcomingEvents: number;
  registrationOpen: number;
  closingSoon: number;
  onlineEvents: number;
  savedEvents: number;
  registeredEvents: number;
}

// --- Calendar Event ---

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'registration_deadline' | 'event_start' | 'event_end' | 'milestone';
  eventId: string;
  category: EventCategory;
  color: string;
}

// --- Category Labels ---

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  mun: 'Model United Nations',
  parliamentary_debate: 'Parliamentary Debate',
  bp_debate: 'British Parliamentary (BP)',
  ap_debate: 'Asian Parliamentary (AP)',
  world_schools_debate: 'World Schools Debate',
  public_forum_debate: 'Public Forum Debate',
  ld_debate: 'Lincoln-Douglas Debate',
  policy_debate: 'Policy Debate',
  public_speaking: 'Public Speaking',
  extempore: 'Extempore',
  youth_parliament: 'Youth Parliament',
  legal_debate: 'Legal Debate',
  policy_diplomacy: 'Policy & Diplomacy',
  online_debate_tournament: 'Online Debate Tournament',
  workshop: 'Workshop & Masterclass',
  bootcamp: 'Bootcamp & Training',
  case_competition: 'Case Competition',
  moot_court: 'Moot Court & Mock Trial',
  quiz_competition: 'Quiz Competition',
  hackathon_policy: 'Policy Hackathon',
  other: 'Other Competition',
};

export const CATEGORY_COLORS: Record<EventCategory, string> = {
  mun: '#6366f1',
  parliamentary_debate: '#8b5cf6',
  bp_debate: '#a78bfa',
  ap_debate: '#7c3aed',
  world_schools_debate: '#2dd4bf',
  public_forum_debate: '#14b8a6',
  ld_debate: '#0d9488',
  policy_debate: '#0891b2',
  public_speaking: '#f59e0b',
  extempore: '#f97316',
  youth_parliament: '#ef4444',
  legal_debate: '#ec4899',
  policy_diplomacy: '#3b82f6',
  online_debate_tournament: '#10b981',
  workshop: '#06b6d4',
  bootcamp: '#0284c7',
  case_competition: '#e11d48',
  moot_court: '#d97706',
  quiz_competition: '#84cc16',
  hackathon_policy: '#10b981',
  other: '#6b7280',
};

export const STATUS_LABELS: Record<RegistrationStatus, string> = {
  open: 'Registration Open',
  opening_soon: 'Opening Soon',
  closing_soon: 'Closing Soon',
  closed: 'Closed',
  upcoming_unverified: 'Status Unverified',
  postponed: 'Postponed',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

export const TRACKING_LABELS: Record<TrackingStatus, string> = {
  interested: 'Interested',
  shortlisted: 'Shortlisted',
  planning_to_apply: 'Planning to Apply',
  applied: 'Applied',
  registered: 'Registered',
  preparing: 'Preparing',
  participated: 'Participated',
  won_award: 'Won Award',
  not_participating: 'Not Participating',
};

export const LOCATION_PRESETS = [
  { value: 'delhi', label: 'Delhi' },
  { value: 'noida', label: 'Noida' },
  { value: 'gurugram', label: 'Gurugram' },
  { value: 'delhi_ncr', label: 'Delhi NCR' },
  { value: 'jaipur', label: 'Jaipur' },
  { value: 'mumbai', label: 'Mumbai' },
  { value: 'bangalore', label: 'Bangalore' },
  { value: 'india', label: 'India' },
  { value: 'international', label: 'International' },
  { value: 'online', label: 'Online' },
];
