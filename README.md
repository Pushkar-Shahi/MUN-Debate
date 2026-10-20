# MUN & Debate Central

A personal centralized discovery, tracking, and management platform for Model United Nations (MUN) conferences, parliamentary debating tournaments, hands-on training workshops, masterclasses, moot court competitions, case challenges, and student orator championships.

---

## 🌟 Overview & Key Features

MUN & Debate Central eliminates the friction of manually visiting dozens of circuit websites, college portals, and social media flyers to discover upcoming opportunities, check eligibility, track registration deadlines, and register teams.

### 1. **Discovery & Exploration Engine**
- **Unified Directory**: Aggregates Model UN, British Parliamentary (BP), Asian Parliamentary (AP), World Schools (WSDC), Workshops & Masterclasses, Moot Courts, Case Competitions, Youth Parliament, and Public Speaking championships.
- **Deep Multi-Axis Filtering**:
  - **Category**: MUN, Parliamentary Debate, BP, AP, Workshops & Masterclasses, Bootcamps, Case Competitions, Moot Courts, Quizzes, Policy Hackathons, Youth Parliament, Legal Debate, Public Speaking, Extempore, etc.
  - **Participation Mode**: In-Person (Offline), Virtual (Online), or Hybrid.
  - **Geographic Circuits**: Delhi NCR, Mumbai, Bangalore, Jaipur, International, or Online.
  - **Registration Status & Fee**: Free / Paid / Scholarship available, Open, Closing Soon.
  - **Closing Window Filter**: Filter events closing within 24 hours, 3 days, 7 days, or 14 days.
- **Three Flexible View Modes**:
  - **Grid View**: Rich cards with countdown badges, host information, fee status, and direct action buttons.
  - **Compact List View**: Sleek rows optimized for scanning large circuits rapidly.
  - **Table View**: Tabular data layout with column sorting and quick external links.

### 2. **High-Urgency Deadline Radar (`/closing-soon`)**
- Live countdown gauges with urgency styling:
  - 🔴 **Urgent (< 24 Hours / < 3 Days)**
  - 🟡 **Closing Soon (< 7 Days)**
  - 🔵 **Standard Window (< 14 Days)**
- Direct one-click access to official registration forms and portals.

### 3. **Interactive Calendar & iCal Export (`/calendar`)**
- Month schedule grid highlighting registration deadlines vs. conference days.
- Selected date agenda sidebar showing all events due or occurring on that day.
- **iCalendar (.ics) Export**: One-click export to Google Calendar, Apple Calendar, or Microsoft Outlook.

### 4. **Personal Application Tracker (`/saved` & `/applications`)**
- **Five Pipeline Stages**: Shortlisted → Planning to Apply → Applied / Submitted → Seat Confirmed → Active Preparation.
- **Interactive Kanban Board**: Move events between application stages.
- **Delegate Notes & Checklists**: Track custom preparation tasks (position paper drafts, resolution clauses, team contact details).
- **Portfolio & Trophy Cabinet (`/completed`)**: Record awards won (Best Delegate, High Commendation, Speaker Citations) and past participation history.

### 5. **Data Sources & Crawler Health (`/sources`)**
- Directory of 10+ discovery sources: MyMUN, MUN.Events, Delhi MUN Circuit, Behes, Unstop, ISDS, Lawctopus, LawLit, and more.
- Health status monitors (Healthy, Delayed, Manual Only) and events discovered metrics.
- **Real-Time Sync**: Trigger on-demand sync for individual sources with animated status feedback.
- **Custom Source Registry**: Register new circuit sources, RSS feeds, or manual entry links.

### 6. **Manual Event Creation**
- Dedicated "Add Event" modal with validation for custom or invitation-only tournaments.

---

### 7. **Authentication & User Profiles**
- **Dynamic Auth System (`/login`)**: Complete sign-in & sign-up flows with persistent session management (`localStorage`).
- **Demo Account Shortcut**: Instant one-click "Fill Demo Account" credentials (`demo@muncentral.io` / `password123`) for effortless trial and testing.
- **Protected Routes**: Secure navigation guarding personal trackers, applications, notes, and preferences.
- **User Profile Menu**: Quick access in TopBar and Sidebar with profile details and clean sign-out.

### 8. **Dual Theme Engine (Dark & Light Modes)**
- **Curated High-Contrast Palettes**: True dark mode (`#0f0f12`) and sleek modern light mode (`#f8fafc`) with zero visual contrast hiccups.
- **Instant Toggle**: Sun ☀️ / Moon 🌙 button in TopBar, plus interactive theme selector cards in Settings.
- **Theme Persistence & Auto Detection**: Remembers preference via `localStorage` and respects system `prefers-color-scheme`.

### 9. **All-Device Mobile Optimization**
- **Responsive Navigation**: Collapsible desktop sidebar with smooth transition to overlay mobile drawer with quick close.
- **Adaptive Breakpoints**: Refined views for 375px/390px mobile screens, 768px/1024px tablets, and wide monitors.
- **Mobile Action Header**: Compact global search, touch-friendly notification drawer, and mobile menu toggles.

---

## 🛠 Tech Stack & Architecture

- **Frontend**:
  - React 19 + TypeScript
  - Vite 8
  - `@tanstack/react-query` for asynchronous state management & cache invalidation
  - `react-router-dom` for client-side routing and protected routes
  - `lucide-react` for modern iconography
  - `date-fns` for countdown calculations and calendar interval helpers
  - Dynamic Dual Theme CSS system (Dark & Light mode variables)
- **Backend & Database**:
  - **Cloudflare Workers with Static Assets (`[assets]`)**: Edge API routes and SPA routing handler (`worker/index.ts`)
  - **Cloudflare D1**: Serverless relational SQLite database (`migrations/0001_initial_schema.sql`, `migrations/0002_seed_sources.sql`)
  - **Scheduled Triggers (Cron)**: Background deadline scanning and notification generation
- **Client Storage Engine**:
  - Seamless hybrid storage architecture: connects to Cloudflare Worker API when online, and falls back to persistent `localStorage` with rich verified mock seed data for offline / standalone use.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository and install dependencies
npm install
```

### Running Locally

```bash
# Start Vite development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.
- Log in using your email/password, or click **"Fill Demo Account"** to test with `demo@muncentral.io` / `password123`.

### Building for Production

```bash
npm run build
```

The production output will be generated in `dist/`.

---

## ☁️ Deploying to Cloudflare

The project supports both **Cloudflare Workers + Static Assets** (unified single deployment) and **Cloudflare Pages**.

### Unified Cloudflare Worker + Static Assets (Recommended)

1. **Login to Cloudflare**:
   ```bash
   npx wrangler login
   ```

2. **Create the D1 Database**:
   ```bash
   npx wrangler d1 create mun-debate-central-db
   ```
   Copy the `database_id` output and update it in `wrangler.toml`.

3. **Apply Database Migrations**:
   ```bash
   npm run d1:migrate
   ```

4. **Deploy Frontend & Worker Together**:
   ```bash
   npm run deploy
   ```
   This builds the Vite frontend and deploys both the edge worker and the SPA static assets to Cloudflare in a single step!

### Alternative: Cloudflare Pages Deployment

1. In the Cloudflare Dashboard, go to **Workers & Pages** → **Create application** → **Pages**.
2. Connect your Git repository.
3. Build configuration:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Environment Variable**: `VITE_API_URL` set to your Worker URL (or keep `/api` if binding a worker).

---

## 🤖 Automated Discovery & Crawler Pipeline

MUN & Debate Central features a multi-tiered ingestion engine to discover competitions, conferences, moot courts, and workshops automatically:

1. **Standalone CLI Crawler**:
   ```bash
   # Run discovery preview (dry-run)
   npm run crawl:dry

   # Run live ingestion
   npm run crawl
   ```
   Scans RSS opportunity streams, legal journals, and circuit intelligence queries across Indian and international circuits, extracting title, category, format, registration links, and deadlines.

2. **Automated Scheduled Ingestion (GitHub Actions & Cloudflare Cron)**:
   - **GitHub Actions Workflow** ([.github/workflows/scheduled-crawler.yml](file:///.github/workflows/scheduled-crawler.yml)): Runs daily at `06:00 UTC` to scan circuit feeds and ingest newly announced opportunities.
   - **Cloudflare Worker Cron Trigger** ([worker/index.ts](file:///worker/index.ts)): Configured in `wrangler.toml` (`0 */6 * * *`) to automatically query active sources and generate approaching deadline notifications every 6 hours.

3. **On-Demand Source Sync in UI**:
   - Go to **Sources** (`/sources`) in the web interface and click **"Sync"** on any source adapter to trigger immediate live scraping and ingestion with animated progress feedback.

---

## 📄 License

MIT License. Designed for student delegates, parliamentary debaters, and circuit organizers.

