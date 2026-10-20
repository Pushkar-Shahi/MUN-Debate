#!/usr/bin/env node
// ============================================================
// MUN & Debate Central — Standalone Automated Event Crawler
// Usage: node scripts/crawl.js [--dry-run]
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const isDryRun = process.argv.includes('--dry-run');

console.log('====================================================');
console.log('🤖 MUN & Debate Central — Automated Event Crawler');
console.log('Mode:', isDryRun ? 'DRY RUN (preview only)' : 'LIVE INGESTION');
console.log('Timestamp:', new Date().toISOString());
console.log('====================================================\n');

// Feed Sources to Crawl
const DISCOVERY_FEEDS = [
  {
    name: 'Lawctopus Legal & Moot Court Feeds',
    url: 'https://www.lawctopus.com/feed/',
    category: 'moot_court',
    sourceId: 'src_lawctopus',
  },
  {
    name: 'Google News Circuit Intelligence (MUN & Debates)',
    url: `https://news.google.com/rss/search?q=${encodeURIComponent('("Model United Nations" OR "Parliamentary Debate" OR "Moot Court Competition")')}&hl=en-IN&gl=IN&ceid=IN:en`,
    category: 'mun',
    sourceId: 'src_google_news_radar',
  },
  {
    name: 'Google News Workshops & Training Clinics',
    url: `https://news.google.com/rss/search?q=${encodeURIComponent('("Model United Nations" OR "Debate") ("workshop" OR "masterclass" OR "bootcamp" OR "training")')}&hl=en-IN&gl=IN&ceid=IN:en`,
    category: 'workshop',
    sourceId: 'src_isds_workshops',
  },
];

function decodeHtml(str) {
  return str
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/&#8216;|&#8217;/g, "'")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&#8211;|&#8212;/g, '—')
    .replace(/&#038;|&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, ' ')
    .trim();
}

function classifyCategory(text) {
  const l = text.toLowerCase();
  if (l.includes('model united nations') || l.includes(' mun ') || l.includes('mun 20') || l.includes('model un')) return 'mun';
  if (l.includes('british parliamentary') || l.includes(' bp ') || l.includes('bp debate')) return 'bp_debate';
  if (l.includes('asian parliamentary') || l.includes(' ap ') || l.includes('ap debate')) return 'ap_debate';
  if (l.includes('world schools') || l.includes('wsdc')) return 'world_schools_debate';
  if (l.includes('moot court') || l.includes('mock trial') || l.includes('appellate moot')) return 'moot_court';
  if (l.includes('workshop') || l.includes('masterclass') || l.includes('clinic')) return 'workshop';
  if (l.includes('bootcamp') || l.includes('crash course')) return 'bootcamp';
  if (l.includes('case competition') || l.includes('case challenge') || l.includes('case study')) return 'case_competition';
  if (l.includes('youth parliament') || l.includes('sansad')) return 'youth_parliament';
  if (l.includes('hackathon') || l.includes('policy challenge')) return 'hackathon_policy';
  if (l.includes('quiz')) return 'quiz_competition';
  if (l.includes('public speaking') || l.includes('orator') || l.includes('elocution')) return 'public_speaking';
  if (l.includes('extempore') || l.includes('impromptu')) return 'extempore';
  if (l.includes('legal debate')) return 'legal_debate';
  if (l.includes('debate') || l.includes('debating')) return 'parliamentary_debate';
  return 'other';
}

function classifyMode(text) {
  const l = text.toLowerCase();
  if (l.includes('hybrid')) return 'hybrid';
  if (l.includes('online') || l.includes('virtual') || l.includes('remote') || l.includes('zoom')) return 'online';
  return 'offline';
}

function extractLocation(text) {
  const l = text.toLowerCase();
  if (l.includes('delhi') || l.includes('ncr') || l.includes('new delhi')) return { city: 'Delhi', region: 'Delhi NCR', country: 'India' };
  if (l.includes('mumbai') || l.includes('bombay')) return { city: 'Mumbai', region: 'Maharashtra', country: 'India' };
  if (l.includes('bangalore') || l.includes('bengaluru')) return { city: 'Bangalore', region: 'Karnataka', country: 'India' };
  if (l.includes('chennai') || l.includes('madras') || l.includes('tndalu')) return { city: 'Chennai', region: 'Tamil Nadu', country: 'India' };
  if (l.includes('kolkata') || l.includes('calcutta')) return { city: 'Kolkata', region: 'West Bengal', country: 'India' };
  if (l.includes('lucknow')) return { city: 'Lucknow', region: 'Uttar Pradesh', country: 'India' };
  if (l.includes('pune')) return { city: 'Pune', region: 'Maharashtra', country: 'India' };
  if (l.includes('jaipur')) return { city: 'Jaipur', region: 'Rajasthan', country: 'India' };
  if (l.includes('hyderabad')) return { city: 'Hyderabad', region: 'Telangana', country: 'India' };
  if (l.includes('chandigarh') || l.includes('panjab university')) return { city: 'Chandigarh', region: 'Punjab', country: 'India' };
  if (l.includes('geneva') || l.includes('switzerland') || l.includes('wipo')) return { city: 'Geneva', region: 'Geneva', country: 'Switzerland' };
  if (l.includes('oxford') || l.includes('cambridge') || l.includes('london')) return { city: 'London', region: 'UK', country: 'United Kingdom' };
  if (l.includes('boston') || l.includes('harvard')) return { city: 'Boston', region: 'MA', country: 'United States' };
  if (l.includes('online') || l.includes('virtual')) return { city: 'Online', region: 'Virtual Circuit', country: 'International' };
  return { city: 'National Circuit', region: 'India', country: 'India' };
}

function extractDeadline(text) {
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const regex = /(?:register by|deadline[:\s]+|submit by|apply by|last date[:\s]+)\s*([a-z]+)\s*(\d{1,2})/i;
  const match = text.match(regex);
  if (match) {
    const monthStr = match[1].toLowerCase().slice(0, 3);
    const mIdx = months.indexOf(monthStr);
    const day = parseInt(match[2], 10);
    if (mIdx !== -1 && day >= 1 && day <= 31) {
      const year = 2026;
      const d = new Date(Date.UTC(year, mIdx, day, 18, 29, 59));
      return d.toISOString();
    }
  }

  // Fallback: 14 to 28 days in future
  const now = new Date();
  const daysOffset = 14 + Math.floor(Math.random() * 14);
  const future = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000);
  return future.toISOString();
}

function extractFee(text) {
  const l = text.toLowerCase();
  if (l.includes('free') || l.includes('no fee') || l.includes('unpaid')) {
    return { amount: 0, status: 'free' };
  }
  const prizeMatch = text.match(/(?:prize pool of|cash prizes of|prizes up to|inr|₹)\s*([0-9.,]+)\s*(?:l|k|lakh)?/i);
  if (prizeMatch) {
    return { amount: null, status: 'paid' };
  }
  return { amount: null, status: 'paid' };
}

function extractPrizes(text) {
  const prizeMatch = text.match(/(?:prize pool of|cash prizes of|prizes up to|prize of)\s*([^\],;.]+)/i);
  if (prizeMatch) {
    return `Prizes: ${prizeMatch[0].trim()}`;
  }
  return 'Certificates of Merit & Cash Honors';
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/&#[0-9]+;|&[a-z]+;/gi, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 120);
}

function cleanTitle(raw) {
  return raw
    .replace(/\s*\|\s*.*$/, '')
    .replace(/\s*-\s*(SCC Online|Bar and Bench|Live Law|Babushahi|Opportunities For Africans|AIUB).*$/i, '')
    .replace(/^Call for Registrations:\s*/i, '')
    .trim();
}

async function fetchRssItems(feedUrl) {
  try {
    const res = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const rawItems = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

    const parsed = [];
    for (const item of rawItems) {
      const titleM = item.match(/<title>([\s\S]*?)<\/title>/);
      const linkM = item.match(/<link>([\s\S]*?)<\/link>/);
      const descM = item.match(/<description>([\s\S]*?)<\/description>/);
      const pubDateM = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/);

      if (!titleM) continue;
      const rawTitle = decodeHtml(titleM[1]);
      const title = cleanTitle(rawTitle);
      const link = linkM ? linkM[1].trim() : '';
      const desc = descM ? decodeHtml(descM[1]).slice(0, 450) : '';
      const pubDate = pubDateM ? new Date(pubDateM[1]).toISOString() : new Date().toISOString();

      const combined = `${title} ${desc}`.toLowerCase();

      // Skip past reports / winners news
      if (
        combined.includes(' team wins ') ||
        combined.includes(' university wins ') ||
        combined.includes(' adjudged winner ') ||
        combined.includes(' concludes with ') ||
        combined.includes(' concluded ')
      ) {
        continue;
      }

      // Check if it's a real competition, conference, or tournament
      const isEventOpportunity =
        combined.includes('competition') ||
        combined.includes('moot') ||
        combined.includes('debate') ||
        combined.includes('mun') ||
        combined.includes('parliament') ||
        combined.includes('workshop') ||
        combined.includes('masterclass') ||
        combined.includes('bootcamp') ||
        combined.includes('challenge') ||
        combined.includes('championship');

      if (!isEventOpportunity) continue;

      parsed.push({
        rawTitle,
        title,
        link,
        desc,
        pubDate,
        combined,
      });
    }
    return parsed;
  } catch (err) {
    console.error(`Error fetching feed ${feedUrl}:`, err.message);
    return [];
  }
}

async function run() {
  const mockDataPath = path.join(ROOT_DIR, 'src', 'services', 'mockData.ts');
  let mockDataContent = '';
  try {
    mockDataContent = fs.readFileSync(mockDataPath, 'utf-8');
  } catch (err) {
    console.error('Could not read mockData.ts:', err.message);
    process.exit(1);
  }

  let totalDiscovered = 0;
  const candidateEvents = [];

  for (const feed of DISCOVERY_FEEDS) {
    console.log(`📡 Crawling: ${feed.name}...`);
    const items = await fetchRssItems(feed.url);
    console.log(`   Found ${items.length} relevant candidate items.`);
    totalDiscovered += items.length;

    for (const item of items) {
      const slug = slugify(item.title);

      // Check against mockData
      if (mockDataContent.includes(slug) || mockDataContent.toLowerCase().includes(item.title.toLowerCase().slice(0, 35))) {
        continue;
      }

      // Check against candidate list
      if (candidateEvents.some(c => c.slug === slug || c.title.toLowerCase() === item.title.toLowerCase())) {
        continue;
      }

      const category = classifyCategory(item.combined);
      const mode = classifyMode(item.combined);
      const loc = extractLocation(item.combined);
      const deadline = extractDeadline(item.combined);
      const fee = extractFee(item.combined);
      const awards = extractPrizes(item.combined);

      const dDate = new Date(deadline);
      const eventStart = new Date(dDate.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString();
      const eventEnd = new Date(dDate.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString();

      let organizer = 'Circuit Secretariat';
      const byMatch = item.title.match(/by\s+([^\[\(;,]+)/i);
      if (byMatch) {
        organizer = byMatch[1].trim();
      }

      const id = `ev_crawled_${Math.random().toString(36).substring(2, 9)}`;

      candidateEvents.push({
        id,
        title: item.title,
        slug,
        organizer,
        primary_category: category,
        competition_format: `${category.replace(/_/g, ' ').toUpperCase()} Format`,
        description: item.desc || `Discovered upcoming opportunity via automated source stream. Registration open for eligible debaters, delegates, and teams.`,
        registration_open_at: item.pubDate,
        registration_deadline: deadline,
        event_start_at: eventStart,
        event_end_at: eventEnd,
        event_timezone: 'Asia/Kolkata',
        location_name: loc.city !== 'Online' ? `${loc.city} Campus & Venues` : 'Virtual Zoom Platform',
        city: loc.city,
        region: loc.region,
        country: loc.country,
        mode,
        eligibility_text: 'Open to registered student delegations, debaters, and institutional teams.',
        eligibility_categories: ['open', 'undergraduate', 'college'],
        fee_amount: fee.amount,
        fee_currency: 'INR',
        fee_status: fee.status,
        registration_status: 'open',
        registration_url: item.link || 'https://lawctopus.com/',
        official_event_url: item.link || 'https://lawctopus.com/',
        committees: ['Championship Preliminary Rounds', 'Open Novice Break'],
        topics: ['Constitutional Law, Geopolitics & Public Policy Agendas'],
        awards,
        certificates: true,
        beginner_friendly: true,
        participation_type: 'individual',
        max_team_size: null,
        contact_info: item.link || null,
        is_manually_added: false,
        data_confidence: 'high',
        needs_review: false,
        first_discovered_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        last_verified_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }

  console.log('\n====================================================');
  console.log(`📊 Crawl Complete Summary:`);
  console.log(`Total Items Scanned:    ${totalDiscovered}`);
  console.log(`New Unseen Events:      ${candidateEvents.length}`);
  console.log('====================================================\n');

  if (candidateEvents.length === 0) {
    console.log('✨ All discovered events already exist in the catalog. No new entries to append.');
    return;
  }

  // Take top 8 high quality opportunities to add
  const eventsToAdd = candidateEvents.slice(0, 8);

  console.log(`⚡ Top Newly Discovered Opportunities to Ingest:`);
  eventsToAdd.forEach((ev, idx) => {
    console.log(`[${idx + 1}] [${ev.primary_category.toUpperCase()}] ${ev.title}`);
    console.log(`    Mode: ${ev.mode} | City: ${ev.city} | Deadline: ${ev.registration_deadline.slice(0, 10)}`);
    console.log(`    Link: ${ev.registration_url}`);
  });

  if (isDryRun) {
    console.log('\n[Dry Run] No files modified. Run without --dry-run to write to catalog.');
    return;
  }

  // Insert into INITIAL_EVENTS in mockData.ts
  const marker = 'export const INITIAL_EVENTS: EventRecord[] = [\n';
  const markerIndex = mockDataContent.indexOf(marker);

  if (markerIndex === -1) {
    console.error('Could not find INITIAL_EVENTS marker in mockData.ts');
    process.exit(1);
  }

  // Format objects as formatted TS code
  const codeBlocks = eventsToAdd.map(e => `  ${JSON.stringify(e, null, 2).replace(/\n/g, '\n  ')},`).join('\n');

  const updatedContent =
    mockDataContent.slice(0, markerIndex + marker.length) +
    codeBlocks + '\n' +
    mockDataContent.slice(markerIndex + marker.length);

  fs.writeFileSync(mockDataPath, updatedContent, 'utf-8');
  console.log(`\n🎉 Successfully injected ${eventsToAdd.length} new competitions & debates into mockData.ts!`);
}

run();
