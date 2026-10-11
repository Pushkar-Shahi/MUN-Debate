# MUN & Debate Central

A personal centralized discovery, tracking, and management platform for Model United Nations (MUN) conferences, parliamentary debating tournaments, Youth Parliament sessions, and national student orator competitions.

---

## 🌟 Overview & Key Features

MUN & Debate Central eliminates the friction of manually visiting dozens of circuit websites, college portals, and social media flyers to discover upcoming opportunities, check eligibility, track registration deadlines, and register teams.

### 1. **Discovery & Exploration Engine**
- **Unified Directory**: Aggregates Model UN, British Parliamentary (BP), Asian Parliamentary (AP), World Schools (WSDC), Youth Parliament, and Public Speaking competitions.
- **Deep Multi-Axis Filtering**:
  - **Category**: MUN, Parliamentary Debate, BP, AP, Youth Parliament, Legal Debate, Public Speaking, Extempore, etc.
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

## 🛠 Tech Stack & Architecture

- **Frontend**:
  - React 19 + TypeScript
  - Vite 8
  - `@tanstack/react-query` for asynchronous state management & cache invalidation
  - `react-router-dom` for client-side routing
  - `lucide-react` for modern iconography
  - `date-fns` for countdown calculations and calendar interval helpers
  - Custom dark-mode design system with responsive CSS tokens
- **Backend & Database**:
  - **Cloudflare Workers**: High-performance edge API handler (`worker/index.ts`)
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

### Building for Production

```bash
npm run build
```

The production output will be generated in `dist/`.

---

## ☁️ Deploying to Cloudflare

### 1. Cloudflare D1 Database Setup

```bash
# Login to Cloudflare
npx wrangler login

# Create D1 database
npx wrangler d1 create mun-debate-central-db

# Run migrations to set up schema and initial sources
npx wrangler d1 execute mun-debate-central-db --file=migrations/0001_initial_schema.sql
npx wrangler d1 execute mun-debate-central-db --file=migrations/0002_seed_sources.sql
```

Update your `wrangler.toml` with the generated `database_id`.

### 2. Deploy Worker API

```bash
npx wrangler deploy
```

### 3. Deploy Frontend on Cloudflare Pages

1. In the Cloudflare Dashboard, go to **Workers & Pages** → **Create application** → **Pages**.
2. Connect your Git repository.
3. Build configuration:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Environment Variable**: `VITE_API_URL` set to your Worker URL (or keep `/api` if using Cloudflare Pages Functions / route proxy).

---

## 📄 License

MIT License. Designed for student delegates, parliamentary debaters, and circuit organizers.
