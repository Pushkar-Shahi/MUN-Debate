-- MUN & Debate Central — Seed Data
-- Initial Source Registry (verified Oct 2026)

-- MUN Discovery Sources
INSERT OR IGNORE INTO sources (id, name, url, category, integration_mode, health, priority, is_active, integration_notes) VALUES
  ('src_mymun', 'MyMUN', 'https://mymun.com/', 'mun', 'structured_page', 'manual_only', 1, 1, 'Angular SPA — client-rendered conference list. No public API discovered. Integration requires structured page parsing of rendered content. Manual entry supported as fallback.'),
  ('src_mun_events', 'MUN.Events', 'https://www.mun.events/conferenceList', 'mun', 'structured_page', 'manual_only', 1, 1, 'Laravel-based conference directory with DataTables. Server-rendered HTML with conference data. Potential for structured page adapter.'),
  ('src_model_diplomat', 'Model Diplomat', 'https://modeldiplomat.com/conferences', 'mun', 'structured_page', 'manual_only', 2, 1, 'Conference directory with filters. Structured HTML content. Potential for adapter development.'),
  ('src_delhi_mun', 'Delhi MUN', 'https://www.delhimun.in/muns', 'mun', 'structured_page', 'manual_only', 2, 1, 'Delhi-focused MUN listings. Website accessible, content structure to be evaluated.'),
  ('src_fairgaze_mun', 'FairGaze MUN', 'https://mun.fairgaze.com/', 'mun', 'structured_page', 'manual_only', 2, 1, 'School-focused MUN platform. Event listings available on site.'),
  ('src_munflow', 'MUNFLOW', 'https://www.munflow.in/conferences', 'mun', 'manual', 'manual_only', 3, 1, 'Indian MUN conference directory. Site accessibility to be verified during adapter development.');

-- Debate & Competition Sources
INSERT OR IGNORE INTO sources (id, name, url, category, integration_mode, health, priority, is_active, integration_notes) VALUES
  ('src_behes', 'Behes — Debate for All', 'https://www.behes.org/', 'debate', 'manual', 'manual_only', 2, 1, 'Indian debate community platform. Event listings and resources available.'),
  ('src_unstop', 'Unstop', 'https://unstop.com/competitions', 'student_competition', 'structured_page', 'manual_only', 1, 1, 'Large competition platform with extensive listings. React SPA with API-driven content. Potential API discovery needed.'),
  ('src_lawlit', 'LawLit', 'https://lawlit.in/legal-debate-competitions', 'debate', 'manual', 'manual_only', 3, 1, 'Legal debate competition listings. Niche source for legal debate events.'),
  ('src_isds', 'Indian Schools Debating Society', 'https://indianschoolsdebatingsociety.com/workshops-calendar/', 'debate', 'manual', 'manual_only', 2, 1, 'ISDS workshops and calendar. School-level debating events.'),
  ('src_idl', 'Indian Debating League', 'https://www.indiandebatingleague.com/idl2026', 'debate', 'manual', 'manual_only', 2, 1, 'IDL tournament information. Single-event source, may have seasonal updates.'),
  ('src_debaters_india', 'Debaters of India', 'https://debatersofindia.com/championships.html', 'debate', 'manual', 'manual_only', 3, 1, 'Championship listings for Indian debate community.'),
  ('src_speech_debate', 'Speech Debate India', 'https://www.speechdebateindia.com/tournaments', 'debate', 'manual', 'manual_only', 2, 1, 'Tournament listings for speech and debate in India.'),
  ('src_lawctopus', 'Lawctopus', 'https://lawctopus.com/', 'mixed', 'manual', 'manual_only', 3, 1, 'Legal opportunities platform. Includes debate, MUN, and competition listings among broader legal content.'),
  ('src_harvard_debate', 'Harvard Debate India / WDC', 'https://www.harvarddebateindia.in/wdc2026', 'debate', 'manual', 'manual_only', 2, 1, 'World Debating Championship India page. Event-specific source.');
