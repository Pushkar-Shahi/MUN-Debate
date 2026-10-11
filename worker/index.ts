// ============================================================
// MUN & Debate Central — Cloudflare Worker API
// ============================================================

export interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
}

// UUID generation compatible with Workers runtime
function generateId(): string {
  return crypto.randomUUID();
}

// Slug generation
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 200);
}

// CORS headers
function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders(),
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ success: false, error: message }, status);
}

// ============================================================
// Route Handlers
// ============================================================

// --- Dashboard Stats ---
async function getDashboardStats(db: D1Database): Promise<Response> {
  const now = new Date().toISOString();
  const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const [upcoming, regOpen, closing, online, saved, registered] = await Promise.all([
    db.prepare(`SELECT COUNT(*) as count FROM events WHERE event_start_at > ? AND registration_status != 'cancelled'`).bind(now).first<{count: number}>(),
    db.prepare(`SELECT COUNT(*) as count FROM events WHERE registration_status = 'open'`).first<{count: number}>(),
    db.prepare(`SELECT COUNT(*) as count FROM events WHERE registration_deadline IS NOT NULL AND registration_deadline > ? AND registration_deadline <= ? AND registration_status != 'closed' AND registration_status != 'cancelled'`).bind(now, weekFromNow).first<{count: number}>(),
    db.prepare(`SELECT COUNT(*) as count FROM events WHERE mode = 'online' AND (event_start_at > ? OR event_start_at IS NULL)`).bind(now).first<{count: number}>(),
    db.prepare(`SELECT COUNT(*) as count FROM saved_events`).first<{count: number}>(),
    db.prepare(`SELECT COUNT(*) as count FROM saved_events WHERE status = 'registered'`).first<{count: number}>(),
  ]);

  return jsonResponse({
    success: true,
    data: {
      upcomingEvents: upcoming?.count ?? 0,
      registrationOpen: regOpen?.count ?? 0,
      closingSoon: closing?.count ?? 0,
      onlineEvents: online?.count ?? 0,
      savedEvents: saved?.count ?? 0,
      registeredEvents: registered?.count ?? 0,
    },
  });
}

// --- Events ---
async function getEvents(db: D1Database, url: URL): Promise<Response> {
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const offset = (page - 1) * limit;
  const search = url.searchParams.get('search') || '';
  const category = url.searchParams.get('category') || '';
  const mode = url.searchParams.get('mode') || '';
  const city = url.searchParams.get('city') || '';
  const country = url.searchParams.get('country') || '';
  const registrationStatus = url.searchParams.get('registration_status') || '';
  const feeStatus = url.searchParams.get('fee_status') || '';
  const eligibility = url.searchParams.get('eligibility') || '';
  const dateStart = url.searchParams.get('date_start') || '';
  const dateEnd = url.searchParams.get('date_end') || '';
  const closingWithin = url.searchParams.get('closing_within') || '';
  const sourceId = url.searchParams.get('source_id') || '';
  const sortBy = url.searchParams.get('sort_by') || 'event_start_at';
  const sortOrder = url.searchParams.get('sort_order') || 'asc';
  const savedOnly = url.searchParams.get('saved_only') === 'true';

  let conditions: string[] = [];
  let params: unknown[] = [];

  if (search) {
    conditions.push(`(e.title LIKE ? OR e.organizer LIKE ? OR e.description LIKE ? OR e.city LIKE ? OR e.competition_format LIKE ? OR e.location_name LIKE ? OR e.country LIKE ?)`);
    const s = `%${search}%`;
    params.push(s, s, s, s, s, s, s);
  }
  if (category) {
    const cats = category.split(',');
    conditions.push(`e.primary_category IN (${cats.map(() => '?').join(',')})`);
    params.push(...cats);
  }
  if (mode) {
    const modes = mode.split(',');
    conditions.push(`e.mode IN (${modes.map(() => '?').join(',')})`);
    params.push(...modes);
  }
  if (city) {
    const cities = city.split(',');
    const cityConditions = cities.map((c: string) => {
      if (c === 'delhi_ncr') return `(e.city LIKE '%Delhi%' OR e.city LIKE '%Noida%' OR e.city LIKE '%Gurugram%' OR e.city LIKE '%Gurgaon%' OR e.city LIKE '%Faridabad%' OR e.city LIKE '%Ghaziabad%' OR e.region LIKE '%NCR%')`;
      if (c === 'india') return `e.country = 'India'`;
      if (c === 'international') return `e.country != 'India'`;
      if (c === 'online') return `e.mode = 'online'`;
      params.push(`%${c}%`);
      return `e.city LIKE ?`;
    });
    conditions.push(`(${cityConditions.join(' OR ')})`);
  }
  if (country) {
    conditions.push(`e.country = ?`);
    params.push(country);
  }
  if (registrationStatus) {
    const statuses = registrationStatus.split(',');
    conditions.push(`e.registration_status IN (${statuses.map(() => '?').join(',')})`);
    params.push(...statuses);
  }
  if (feeStatus) {
    const fees = feeStatus.split(',');
    conditions.push(`e.fee_status IN (${fees.map(() => '?').join(',')})`);
    params.push(...fees);
  }
  if (eligibility) {
    const eligibilities = eligibility.split(',');
    const eligConditions = eligibilities.map(() => `e.eligibility_categories LIKE ?`);
    conditions.push(`(${eligConditions.join(' OR ')})`);
    eligibilities.forEach(el => params.push(`%${el}%`));
  }
  if (dateStart) {
    conditions.push(`e.event_start_at >= ?`);
    params.push(dateStart);
  }
  if (dateEnd) {
    conditions.push(`e.event_start_at <= ?`);
    params.push(dateEnd);
  }
  if (closingWithin) {
    const days = parseInt(closingWithin);
    const now = new Date().toISOString();
    const future = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    conditions.push(`e.registration_deadline IS NOT NULL AND e.registration_deadline > ? AND e.registration_deadline <= ?`);
    params.push(now, future);
  }
  if (sourceId) {
    conditions.push(`EXISTS (SELECT 1 FROM event_source_mappings esm WHERE esm.event_id = e.id AND esm.source_id = ?)`);
    params.push(sourceId);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const validSorts = ['event_start_at', 'registration_deadline', 'title', 'created_at', 'updated_at', 'city'];
  const sort = validSorts.includes(sortBy) ? sortBy : 'event_start_at';
  const order = sortOrder === 'desc' ? 'DESC' : 'ASC';

  let fromClause = 'FROM events e';
  if (savedOnly) {
    fromClause = 'FROM events e INNER JOIN saved_events se ON e.id = se.event_id';
  }

  const countResult = await db.prepare(`SELECT COUNT(*) as total ${fromClause} ${where}`).bind(...params).first<{total: number}>();
  const total = countResult?.total ?? 0;

  const events = await db.prepare(
    `SELECT e.*, 
     (SELECT se.status FROM saved_events se WHERE se.event_id = e.id) as saved_status,
     (SELECT se.id FROM saved_events se WHERE se.event_id = e.id) as saved_id
     ${fromClause} ${where}
     ORDER BY 
       CASE WHEN e.${sort} IS NULL THEN 1 ELSE 0 END,
       e.${sort} ${order}
     LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all();

  return jsonResponse({
    success: true,
    data: events.results?.map(parseEventRow) ?? [],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

async function getEvent(db: D1Database, id: string): Promise<Response> {
  const event = await db.prepare(
    `SELECT e.*,
     (SELECT se.status FROM saved_events se WHERE se.event_id = e.id) as saved_status,
     (SELECT se.id FROM saved_events se WHERE se.event_id = e.id) as saved_id
     FROM events e WHERE e.id = ?`
  ).bind(id).first();

  if (!event) return errorResponse('Event not found', 404);

  // Get source mappings
  const sources = await db.prepare(
    `SELECT esm.*, s.name as source_name, s.url as source_base_url
     FROM event_source_mappings esm
     JOIN sources s ON esm.source_id = s.id
     WHERE esm.event_id = ?`
  ).bind(id).all();

  // Get saved event details
  const savedDetails = await db.prepare(
    `SELECT * FROM saved_events WHERE event_id = ?`
  ).bind(id).first();

  return jsonResponse({
    success: true,
    data: {
      ...parseEventRow(event),
      sources: sources.results ?? [],
      savedDetails: savedDetails ?? null,
    },
  });
}

async function createEvent(db: D1Database, body: Record<string, unknown>): Promise<Response> {
  const id = generateId();
  const title = body.title as string;
  if (!title?.trim()) return errorResponse('Event title is required');

  const slug = slugify(title) + '-' + id.substring(0, 8);

  await db.prepare(
    `INSERT INTO events (id, title, slug, organizer, primary_category, competition_format, description,
     registration_open_at, registration_deadline, event_start_at, event_end_at, event_timezone,
     location_name, city, region, country, mode, eligibility_text, eligibility_categories,
     fee_amount, fee_currency, fee_status, registration_status, registration_url, official_event_url,
     committees, topics, awards, certificates, beginner_friendly, participation_type,
     max_team_size, contact_info, is_manually_added, data_confidence, needs_review)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
  ).bind(
    id, title.trim(), slug,
    (body.organizer as string) || null,
    (body.primary_category as string) || 'other',
    (body.competition_format as string) || null,
    (body.description as string) || null,
    (body.registration_open_at as string) || null,
    (body.registration_deadline as string) || null,
    (body.event_start_at as string) || null,
    (body.event_end_at as string) || null,
    (body.event_timezone as string) || null,
    (body.location_name as string) || null,
    (body.city as string) || null,
    (body.region as string) || null,
    (body.country as string) || null,
    (body.mode as string) || 'unknown',
    (body.eligibility_text as string) || null,
    JSON.stringify(body.eligibility_categories || []),
    body.fee_amount as number || null,
    (body.fee_currency as string) || null,
    (body.fee_status as string) || 'unknown',
    (body.registration_status as string) || 'upcoming_unverified',
    (body.registration_url as string) || null,
    (body.official_event_url as string) || null,
    JSON.stringify(body.committees || []),
    JSON.stringify(body.topics || []),
    (body.awards as string) || null,
    body.certificates !== undefined ? (body.certificates ? 1 : 0) : null,
    body.beginner_friendly !== undefined ? (body.beginner_friendly ? 1 : 0) : null,
    (body.participation_type as string) || 'unknown',
    body.max_team_size as number || null,
    (body.contact_info as string) || null,
    (body.data_confidence as string) || 'medium',
    body.needs_review ? 1 : 0,
  ).run();

  // If source_id provided, create mapping
  if (body.source_id) {
    await db.prepare(
      `INSERT OR IGNORE INTO event_source_mappings (id, event_id, source_id, source_url)
       VALUES (?, ?, ?, ?)`
    ).bind(generateId(), id, body.source_id, (body.official_event_url as string) || null).run();
  }

  return jsonResponse({ success: true, data: { id, slug } }, 201);
}

async function updateEvent(db: D1Database, id: string, body: Record<string, unknown>): Promise<Response> {
  const existing = await db.prepare('SELECT id FROM events WHERE id = ?').bind(id).first();
  if (!existing) return errorResponse('Event not found', 404);

  const fields: string[] = [];
  const values: unknown[] = [];

  const updateFields: Record<string, string> = {
    title: 'title', organizer: 'organizer', primary_category: 'primary_category',
    competition_format: 'competition_format', description: 'description',
    registration_open_at: 'registration_open_at', registration_deadline: 'registration_deadline',
    event_start_at: 'event_start_at', event_end_at: 'event_end_at', event_timezone: 'event_timezone',
    location_name: 'location_name', city: 'city', region: 'region', country: 'country',
    mode: 'mode', eligibility_text: 'eligibility_text',
    fee_amount: 'fee_amount', fee_currency: 'fee_currency', fee_status: 'fee_status',
    registration_status: 'registration_status', registration_url: 'registration_url',
    official_event_url: 'official_event_url', awards: 'awards',
    participation_type: 'participation_type', max_team_size: 'max_team_size',
    contact_info: 'contact_info', data_confidence: 'data_confidence',
  };

  for (const [key, col] of Object.entries(updateFields)) {
    if (body[key] !== undefined) {
      fields.push(`${col} = ?`);
      values.push(body[key]);
    }
  }

  // JSON fields
  if (body.eligibility_categories !== undefined) {
    fields.push('eligibility_categories = ?');
    values.push(JSON.stringify(body.eligibility_categories));
  }
  if (body.committees !== undefined) {
    fields.push('committees = ?');
    values.push(JSON.stringify(body.committees));
  }
  if (body.topics !== undefined) {
    fields.push('topics = ?');
    values.push(JSON.stringify(body.topics));
  }
  if (body.certificates !== undefined) {
    fields.push('certificates = ?');
    values.push(body.certificates ? 1 : 0);
  }
  if (body.beginner_friendly !== undefined) {
    fields.push('beginner_friendly = ?');
    values.push(body.beginner_friendly ? 1 : 0);
  }
  if (body.needs_review !== undefined) {
    fields.push('needs_review = ?');
    values.push(body.needs_review ? 1 : 0);
  }

  if (fields.length === 0) return errorResponse('No fields to update');

  fields.push("updated_at = datetime('now')");
  values.push(id);

  await db.prepare(`UPDATE events SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  return jsonResponse({ success: true });
}

// --- Saved Events ---
async function getSavedEvents(db: D1Database, url: URL): Promise<Response> {
  const status = url.searchParams.get('status') || '';
  const sortBy = url.searchParams.get('sort_by') || 'updated_at';
  const sortOrder = url.searchParams.get('sort_order') || 'desc';

  let where = '';
  const params: unknown[] = [];
  if (status) {
    where = 'AND se.status = ?';
    params.push(status);
  }

  const validSorts: Record<string, string> = {
    updated_at: 'se.updated_at', created_at: 'se.created_at',
    personal_priority: 'se.personal_priority',
    registration_deadline: 'e.registration_deadline',
    event_start_at: 'e.event_start_at',
  };
  const sort = validSorts[sortBy] || 'se.updated_at';
  const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const results = await db.prepare(
    `SELECT se.*, e.title, e.organizer, e.primary_category, e.competition_format,
     e.event_start_at, e.event_end_at, e.registration_deadline, e.city, e.country,
     e.mode, e.registration_status, e.registration_url, e.official_event_url,
     e.fee_status, e.fee_amount, e.fee_currency, e.eligibility_text, e.slug
     FROM saved_events se
     JOIN events e ON se.event_id = e.id
     WHERE 1=1 ${where}
     ORDER BY ${sort} ${order}`
  ).bind(...params).all();

  return jsonResponse({
    success: true,
    data: results.results ?? [],
  });
}

async function saveEvent(db: D1Database, body: Record<string, unknown>): Promise<Response> {
  const eventId = body.event_id as string;
  if (!eventId) return errorResponse('event_id is required');

  const event = await db.prepare('SELECT id FROM events WHERE id = ?').bind(eventId).first();
  if (!event) return errorResponse('Event not found', 404);

  const existing = await db.prepare('SELECT id FROM saved_events WHERE event_id = ?').bind(eventId).first();
  if (existing) return errorResponse('Event already saved');

  const id = generateId();
  await db.prepare(
    `INSERT INTO saved_events (id, event_id, status, personal_notes, personal_priority)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(
    id, eventId,
    (body.status as string) || 'interested',
    (body.personal_notes as string) || null,
    (body.personal_priority as number) || 3,
  ).run();

  return jsonResponse({ success: true, data: { id } }, 201);
}

async function updateSavedEvent(db: D1Database, id: string, body: Record<string, unknown>): Promise<Response> {
  const existing = await db.prepare('SELECT id FROM saved_events WHERE id = ?').bind(id).first();
  if (!existing) return errorResponse('Saved event not found', 404);

  const fields: string[] = [];
  const values: unknown[] = [];

  const updateFields = ['status', 'personal_notes', 'team_members', 'preparation_checklist',
    'registration_reference', 'personal_priority', 'estimated_cost', 'application_date',
    'outcome', 'award_details'];

  for (const key of updateFields) {
    if (body[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(body[key]);
    }
  }

  if (fields.length === 0) return errorResponse('No fields to update');

  fields.push("updated_at = datetime('now')");
  values.push(id);

  await db.prepare(`UPDATE saved_events SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  return jsonResponse({ success: true });
}

async function deleteSavedEvent(db: D1Database, id: string): Promise<Response> {
  await db.prepare('DELETE FROM saved_events WHERE id = ?').bind(id).run();
  return jsonResponse({ success: true });
}

// --- Sources ---
async function getSources(db: D1Database): Promise<Response> {
  const sources = await db.prepare(
    `SELECT s.*,
     (SELECT COUNT(*) FROM event_source_mappings esm WHERE esm.source_id = s.id) as linked_events
     FROM sources s ORDER BY s.priority ASC, s.name ASC`
  ).all();
  return jsonResponse({ success: true, data: sources.results ?? [] });
}

async function getSource(db: D1Database, id: string): Promise<Response> {
  const source = await db.prepare('SELECT * FROM sources WHERE id = ?').bind(id).first();
  if (!source) return errorResponse('Source not found', 404);

  const recentSyncs = await db.prepare(
    `SELECT * FROM sync_runs WHERE source_id = ? ORDER BY started_at DESC LIMIT 10`
  ).bind(id).all();

  return jsonResponse({
    success: true,
    data: { ...source, recent_syncs: recentSyncs.results ?? [] },
  });
}

async function createSource(db: D1Database, body: Record<string, unknown>): Promise<Response> {
  const name = body.name as string;
  const url = body.url as string;
  if (!name?.trim() || !url?.trim()) return errorResponse('Name and URL are required');

  const id = 'src_' + slugify(name).substring(0, 30);
  await db.prepare(
    `INSERT INTO sources (id, name, url, category, integration_mode, health, priority, is_active, integration_notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, name.trim(), url.trim(),
    (body.category as string) || 'mixed',
    (body.integration_mode as string) || 'manual',
    'manual_only',
    (body.priority as number) || 5,
    body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1,
    (body.integration_notes as string) || null,
  ).run();

  return jsonResponse({ success: true, data: { id } }, 201);
}

async function updateSource(db: D1Database, id: string, body: Record<string, unknown>): Promise<Response> {
  const existing = await db.prepare('SELECT id FROM sources WHERE id = ?').bind(id).first();
  if (!existing) return errorResponse('Source not found', 404);

  const fields: string[] = [];
  const values: unknown[] = [];

  const updateFields = ['name', 'url', 'category', 'integration_mode', 'health',
    'priority', 'integration_notes'];

  for (const key of updateFields) {
    if (body[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(body[key]);
    }
  }
  if (body.is_active !== undefined) {
    fields.push('is_active = ?');
    values.push(body.is_active ? 1 : 0);
  }
  if (fields.length === 0) return errorResponse('No fields to update');

  fields.push("updated_at = datetime('now')");
  values.push(id);

  await db.prepare(`UPDATE sources SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  return jsonResponse({ success: true });
}

// --- Sync Runs ---
async function getSyncRuns(db: D1Database, url: URL): Promise<Response> {
  const sourceId = url.searchParams.get('source_id');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

  let query = 'SELECT sr.*, s.name as source_name FROM sync_runs sr JOIN sources s ON sr.source_id = s.id';
  const params: unknown[] = [];

  if (sourceId) {
    query += ' WHERE sr.source_id = ?';
    params.push(sourceId);
  }

  query += ' ORDER BY sr.started_at DESC LIMIT ?';
  params.push(limit);

  const runs = await db.prepare(query).bind(...params).all();
  return jsonResponse({ success: true, data: runs.results ?? [] });
}

// --- Preferences ---
async function getPreferences(db: D1Database): Promise<Response> {
  const prefs = await db.prepare('SELECT * FROM user_preferences WHERE id = ?').bind('default').first();
  return jsonResponse({ success: true, data: prefs ?? {} });
}

async function updatePreferences(db: D1Database, body: Record<string, unknown>): Promise<Response> {
  const fields: string[] = [];
  const values: unknown[] = [];

  const jsonFields = ['preferred_categories', 'preferred_cities', 'deadline_windows', 'excluded_sources'];
  const scalarFields = ['preferred_mode', 'max_fee', 'preferred_eligibility', 'min_notice_days', 'default_sort', 'theme'];

  for (const key of jsonFields) {
    if (body[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(JSON.stringify(body[key]));
    }
  }
  for (const key of scalarFields) {
    if (body[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(body[key]);
    }
  }

  if (fields.length === 0) return errorResponse('No fields to update');

  fields.push("updated_at = datetime('now')");

  await db.prepare(`UPDATE user_preferences SET ${fields.join(', ')} WHERE id = 'default'`).bind(...values).run();
  return jsonResponse({ success: true });
}

// --- Notifications ---
async function getNotifications(db: D1Database, url: URL): Promise<Response> {
  const unreadOnly = url.searchParams.get('unread') === 'true';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

  let where = '';
  if (unreadOnly) where = 'WHERE n.is_read = 0';

  const results = await db.prepare(
    `SELECT n.*, e.title as event_title, e.slug as event_slug
     FROM notifications n
     LEFT JOIN events e ON n.event_id = e.id
     ${where}
     ORDER BY n.created_at DESC
     LIMIT ?`
  ).bind(limit).all();

  const unreadCount = await db.prepare('SELECT COUNT(*) as count FROM notifications WHERE is_read = 0').first<{count: number}>();

  return jsonResponse({
    success: true,
    data: results.results ?? [],
    unreadCount: unreadCount?.count ?? 0,
  });
}

async function markNotificationRead(db: D1Database, id: string): Promise<Response> {
  if (id === 'all') {
    await db.prepare("UPDATE notifications SET is_read = 1").run();
  } else {
    await db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").bind(id).run();
  }
  return jsonResponse({ success: true });
}

// --- Calendar ---
async function getCalendarEvents(db: D1Database, url: URL): Promise<Response> {
  const start = url.searchParams.get('start') || new Date().toISOString().substring(0, 7) + '-01';
  const end = url.searchParams.get('end') || '';

  const params: unknown[] = [start];
  let endWhere = '';
  if (end) {
    endWhere = 'AND (e.event_start_at <= ? OR e.registration_deadline <= ?)';
    params.push(end, end);
  }

  const events = await db.prepare(
    `SELECT e.id, e.title, e.slug, e.primary_category, e.event_start_at, e.event_end_at,
     e.registration_deadline, e.registration_status, e.mode
     FROM events e
     WHERE (e.event_start_at >= ? OR e.registration_deadline >= ?) ${endWhere}
     ORDER BY e.event_start_at ASC`
  ).bind(...params, start).all();

  return jsonResponse({ success: true, data: events.results ?? [] });
}

// --- ICS Export ---
async function exportICS(db: D1Database, url: URL): Promise<Response> {
  const eventId = url.searchParams.get('event_id') || '';
  const savedOnly = url.searchParams.get('saved') === 'true';

  let events;
  if (eventId) {
    events = await db.prepare('SELECT * FROM events WHERE id = ?').bind(eventId).all();
  } else if (savedOnly) {
    events = await db.prepare(
      `SELECT e.* FROM events e JOIN saved_events se ON e.id = se.event_id ORDER BY e.event_start_at`
    ).all();
  } else {
    events = await db.prepare(
      `SELECT * FROM events WHERE event_start_at IS NOT NULL ORDER BY event_start_at LIMIT 200`
    ).all();
  }

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MUN Debate Central//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const event of (events.results ?? [])) {
    const e = event as Record<string, unknown>;
    if (!e.event_start_at) continue;
    const start = (e.event_start_at as string).replace(/[-:]/g, '').replace(/\.\d+/, '').replace('T', 'T');
    const end = e.event_end_at
      ? (e.event_end_at as string).replace(/[-:]/g, '').replace(/\.\d+/, '').replace('T', 'T')
      : start;

    icsLines.push('BEGIN:VEVENT');
    icsLines.push(`UID:${e.id}@mundebatecentral`);
    icsLines.push(`DTSTART:${start}`);
    icsLines.push(`DTEND:${end}`);
    icsLines.push(`SUMMARY:${(e.title as string).replace(/[,;\\]/g, ' ')}`);
    if (e.description) icsLines.push(`DESCRIPTION:${(e.description as string).substring(0, 200).replace(/\n/g, '\\n')}`);
    if (e.location_name || e.city) icsLines.push(`LOCATION:${[e.location_name, e.city, e.country].filter(Boolean).join(', ')}`);
    if (e.official_event_url) icsLines.push(`URL:${e.official_event_url}`);
    icsLines.push('END:VEVENT');
  }
  icsLines.push('END:VCALENDAR');

  return new Response(icsLines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="mun-debate-events.ics"',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// --- CSV Export ---
async function exportCSV(db: D1Database, url: URL): Promise<Response> {
  const type = url.searchParams.get('type') || 'saved';

  let rows;
  if (type === 'saved') {
    rows = await db.prepare(
      `SELECT se.status, se.personal_notes, se.personal_priority, se.estimated_cost,
       se.application_date, se.outcome, se.award_details,
       e.title, e.organizer, e.primary_category, e.event_start_at, e.event_end_at,
       e.registration_deadline, e.city, e.country, e.mode, e.registration_status,
       e.registration_url, e.official_event_url, e.fee_status, e.fee_amount
       FROM saved_events se JOIN events e ON se.event_id = e.id
       ORDER BY se.updated_at DESC`
    ).all();
  } else {
    rows = await db.prepare(
      `SELECT title, organizer, primary_category, event_start_at, event_end_at,
       registration_deadline, city, country, mode, registration_status,
       registration_url, official_event_url, fee_status, fee_amount,
       eligibility_text, participation_type
       FROM events ORDER BY event_start_at`
    ).all();
  }

  const data = rows.results ?? [];
  if (data.length === 0) {
    return new Response('No data to export', { status: 200, headers: corsHeaders() });
  }

  const headers = Object.keys(data[0] as Record<string, unknown>);
  const csvLines = [headers.join(',')];

  for (const row of data) {
    const r = row as Record<string, unknown>;
    csvLines.push(headers.map(h => {
      const val = r[h];
      if (val === null || val === undefined) return '';
      const str = String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(','));
  }

  return new Response(csvLines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="mun-debate-${type}.csv"`,
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// --- Closing Soon ---
async function getClosingSoon(db: D1Database, url: URL): Promise<Response> {
  const days = parseInt(url.searchParams.get('days') || '7');
  const now = new Date().toISOString();
  const future = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  const events = await db.prepare(
    `SELECT e.*,
     (SELECT se.status FROM saved_events se WHERE se.event_id = e.id) as saved_status,
     (SELECT se.id FROM saved_events se WHERE se.event_id = e.id) as saved_id
     FROM events e
     WHERE e.registration_deadline IS NOT NULL
     AND e.registration_deadline > ?
     AND e.registration_deadline <= ?
     AND e.registration_status NOT IN ('closed', 'cancelled', 'completed')
     ORDER BY e.registration_deadline ASC`
  ).bind(now, future).all();

  return jsonResponse({
    success: true,
    data: (events.results ?? []).map(parseEventRow),
  });
}

// --- Duplicate Reviews ---
async function getDuplicateReviews(db: D1Database): Promise<Response> {
  const reviews = await db.prepare(
    `SELECT dr.*,
     ea.title as event_a_title, ea.organizer as event_a_organizer,
     eb.title as event_b_title, eb.organizer as event_b_organizer
     FROM duplicate_reviews dr
     JOIN events ea ON dr.event_id_a = ea.id
     JOIN events eb ON dr.event_id_b = eb.id
     WHERE dr.status = 'pending'
     ORDER BY dr.similarity_score DESC
     LIMIT 50`
  ).all();

  return jsonResponse({ success: true, data: reviews.results ?? [] });
}

// --- Helper Functions ---
function parseEventRow(row: unknown): Record<string, unknown> {
  const r = row as Record<string, unknown>;
  try {
    if (typeof r.eligibility_categories === 'string') r.eligibility_categories = JSON.parse(r.eligibility_categories as string);
  } catch { r.eligibility_categories = []; }
  try {
    if (typeof r.committees === 'string') r.committees = JSON.parse(r.committees as string);
  } catch { r.committees = []; }
  try {
    if (typeof r.topics === 'string') r.topics = JSON.parse(r.topics as string);
  } catch { r.topics = []; }
  r.certificates = r.certificates === 1;
  r.beginner_friendly = r.beginner_friendly === 1;
  r.is_manually_added = r.is_manually_added === 1;
  r.needs_review = r.needs_review === 1;
  return r;
}

// ============================================================
// Router
// ============================================================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    // API Routes
    try {
      // Dashboard
      if (pathname === '/api/dashboard' && method === 'GET') return getDashboardStats(env.DB);

      // Events
      if (pathname === '/api/events' && method === 'GET') return getEvents(env.DB, url);
      if (pathname === '/api/events' && method === 'POST') {
        const body = await request.json() as Record<string, unknown>;
        return createEvent(env.DB, body);
      }
      if (pathname === '/api/events/closing-soon' && method === 'GET') return getClosingSoon(env.DB, url);
      if (pathname === '/api/events/calendar' && method === 'GET') return getCalendarEvents(env.DB, url);
      if (pathname.match(/^\/api\/events\/([^/]+)$/) && method === 'GET') {
        const id = pathname.split('/')[3];
        return getEvent(env.DB, id);
      }
      if (pathname.match(/^\/api\/events\/([^/]+)$/) && method === 'PATCH') {
        const id = pathname.split('/')[3];
        const body = await request.json() as Record<string, unknown>;
        return updateEvent(env.DB, id, body);
      }

      // Saved Events
      if (pathname === '/api/me/saved-events' && method === 'GET') return getSavedEvents(env.DB, url);
      if (pathname === '/api/me/saved-events' && method === 'POST') {
        const body = await request.json() as Record<string, unknown>;
        return saveEvent(env.DB, body);
      }
      if (pathname.match(/^\/api\/me\/saved-events\/([^/]+)$/) && method === 'PATCH') {
        const id = pathname.split('/')[4];
        const body = await request.json() as Record<string, unknown>;
        return updateSavedEvent(env.DB, id, body);
      }
      if (pathname.match(/^\/api\/me\/saved-events\/([^/]+)$/) && method === 'DELETE') {
        const id = pathname.split('/')[4];
        return deleteSavedEvent(env.DB, id);
      }

      // Sources
      if (pathname === '/api/sources' && method === 'GET') return getSources(env.DB);
      if (pathname === '/api/sources' && method === 'POST') {
        const body = await request.json() as Record<string, unknown>;
        return createSource(env.DB, body);
      }
      if (pathname.match(/^\/api\/sources\/([^/]+)$/) && method === 'GET') {
        const id = pathname.split('/')[3];
        return getSource(env.DB, id);
      }
      if (pathname.match(/^\/api\/sources\/([^/]+)$/) && method === 'PATCH') {
        const id = pathname.split('/')[3];
        const body = await request.json() as Record<string, unknown>;
        return updateSource(env.DB, id, body);
      }

      // Sync Runs
      if (pathname === '/api/sync-runs' && method === 'GET') return getSyncRuns(env.DB, url);

      // Preferences
      if (pathname === '/api/me/preferences' && method === 'GET') return getPreferences(env.DB);
      if (pathname === '/api/me/preferences' && method === 'PUT') {
        const body = await request.json() as Record<string, unknown>;
        return updatePreferences(env.DB, body);
      }

      // Notifications
      if (pathname === '/api/notifications' && method === 'GET') return getNotifications(env.DB, url);
      if (pathname.match(/^\/api\/notifications\/([^/]+)\/read$/) && method === 'POST') {
        const id = pathname.split('/')[3];
        return markNotificationRead(env.DB, id);
      }

      // Exports
      if (pathname === '/api/export/ics' && method === 'GET') return exportICS(env.DB, url);
      if (pathname === '/api/export/csv' && method === 'GET') return exportCSV(env.DB, url);

      // Duplicate Reviews
      if (pathname === '/api/duplicate-reviews' && method === 'GET') return getDuplicateReviews(env.DB);

      // Not found
      return errorResponse('Not Found', 404);
    } catch (err) {
      console.error('API Error:', err);
      return errorResponse(`Internal Error: ${err instanceof Error ? err.message : 'Unknown'}`, 500);
    }
  },

  // Cron Triggers for scheduled ingestion
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('Cron trigger fired:', event.cron);
    // Future: implement source-specific ingestion runs
    // For now, update notification generation for approaching deadlines
    try {
      await generateDeadlineNotifications(env.DB);
    } catch (err) {
      console.error('Cron error:', err);
    }
  },
};

async function generateDeadlineNotifications(db: D1Database): Promise<void> {
  const now = new Date().toISOString();
  const windows = [
    { days: 1, type: 'deadline_24h', label: 'closes in 24 hours' },
    { days: 3, type: 'deadline_3d', label: 'closes in 3 days' },
    { days: 7, type: 'deadline_7d', label: 'closes in 7 days' },
  ];

  for (const window of windows) {
    const future = new Date(Date.now() + window.days * 24 * 60 * 60 * 1000).toISOString();
    const events = await db.prepare(
      `SELECT e.id, e.title, e.registration_deadline FROM events e
       JOIN saved_events se ON e.id = se.event_id
       WHERE e.registration_deadline > ? AND e.registration_deadline <= ?
       AND e.registration_status NOT IN ('closed', 'cancelled', 'completed')
       AND NOT EXISTS (
         SELECT 1 FROM notifications n
         WHERE n.event_id = e.id AND n.type = ?
       )`
    ).bind(now, future, window.type).all();

    for (const event of (events.results ?? [])) {
      const e = event as Record<string, unknown>;
      await db.prepare(
        `INSERT INTO notifications (id, event_id, type, title, message)
         VALUES (?, ?, ?, ?, ?)`
      ).bind(
        crypto.randomUUID(),
        e.id,
        window.type,
        `Deadline Alert: ${e.title}`,
        `Registration for "${e.title}" ${window.label}. Deadline: ${e.registration_deadline}`,
      ).run();
    }
  }
}
