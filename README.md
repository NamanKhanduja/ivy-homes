# Ivy Homes — MERN Stack Property Portal & API Audit

**Candidate:** Naman Khanduja  
**City Scoped:** Chennai (`IVY26-4C3EAEB6A76C`)  
**Assigned Locality:** T Nagar  
**Demo Logins:** `demo1@ivy.homes`, `demo2@ivy.homes`, `demo3@ivy.homes` (Password: `117e45bfc1`)  
**Live Demo:** [https://ivy-homes-assignment.vercel.app](https://ivy-homes-assignment.vercel.app)

---

## Technical Stack Architecture

This project is built using a modern **MERN (MongoDB/Express/React/Node.js)** full-stack architecture:

- **Frontend**: React 18 SPA + Vite + Tailwind CSS + Lucide Icons + Recharts (Interactive visual analytics).
- **Backend API Layer**: Node.js & Express proxy server (`api/index.js`). Handles authentication headers, data normalization (unit fixes, deduplication, corrupt data filtering), and fallback endpoint handlers.
- **Deployment**: Vercel Serverless Functions (`@vercel/node`) + Vercel Static Frontend.

---

## How to Run Locally

### Prerequisites
- Node.js `v18+` or `v22+` installed.

### Setup & Launch

1. **Clone the repository and install dependencies:**
   ```bash
   git clone https://github.com/namankhanduja/ivy-homes-assignment.git
   cd ivy-homes-assignment
   npm install
   ```

2. **Run in Development Mode (Frontend + Backend Proxy):**
   ```bash
   # Terminal 1: Run Express Backend Server (Port 3001)
   npm run server

   # Terminal 2: Run Vite React Frontend (Port 3000)
   npm run dev
   ```

3. **Open Application in Browser:**
   - Open `http://localhost:3000`
   - Log in using any demo account (`demo1@ivy.homes`, `demo2@ivy.homes`, or `demo3@ivy.homes`) with password `117e45bfc1`.

---

## Audit Methodology & How We Discovered Documentation Lies

We approached the API auditing as a multi-stage systematic investigation:

1. **Automated Sweep & Probe Scripts**:
   We wrote automated Node.js scripts (`scripts/fetch_all_data.js`, `scripts/solve_questions_and_lies.js`, `scripts/test_filters.js`) to systematically pull all 4,000 retrievable listings, 1,500 rentals, and 450 project records while capturing header error responses.

2. **Header & Auth Probe**:
   - Initial `GET /v1/listings?api_key=...` returned 401 requiring `X-API-Key` header instead of query parameters.
   - Calling `/auth/login` revealed `access_token`, `refresh_token`, and a 15-minute expiration (`expires_in: 900`) instead of the documented 24-hour single `token`.
   - Browsing listings without `Authorization: Bearer` token failed, proving auth is mandatory for all `/v1/` endpoints.

3. **Unit Mismatch Detection**:
   - By calculating price-per-square-foot ratios across all 50 unique physical properties, 4 listings (`MAG-4003885`, `MAG-4002264`, `MAG-4003492`, `MAG-4000039`) showed extreme room sizes (< 40 sqft / BHK). Converting their `carpet_area` from **Square Meters to Square Feet** (`x 10.7639`) aligned them perfectly with city norms.
   - In `/v1/projects`, `price_min` and `price_max` were floating point numbers in **Lakhs / Crores** (e.g., 66.1 Lakhs, 1.95 Crores) rather than integer Indian Rupees.

4. **Deduplication & Consistency Auditing**:
   - Grouping all 4,000 retrievable records by `listing_id` proved that every page repeats the exact same 50 unique properties **80 times**.
   - Comparing `project_id` references in listings against `/v1/projects` revealed 37 listings linking to non-existent project IDs (`P40244`, `P40142`, etc.), and 43 projects reporting incorrect `total_listings` counts.

---

## Hypotheses Checked That Turned Out to Be Fine

The hypotheses that did **not** pan out provided crucial insights into what the API actually does right:

1. **Hypothesis: Server-side filtering parameters (`locality`, `bhk`, `furnishing`, `min_price`, `max_price`) are quietly ignored.**
   - *Result*: **Fine**. We sent test requests filtering by `locality=adyar`, `bhk=3`, and `furnishing=fully-furnished`. In all cases, 100% of returned records strictly matched the filter criteria. The filter parameters work as advertised.

2. **Hypothesis: Server-side sorting (`sort_by=price`, `order=desc`) does not sort correctly.**
   - *Result*: **Fine**. Requesting `sort_by=price&order=desc` returned strictly monotonically decreasing prices across all returned pages.

3. **Hypothesis: Timestamp strings in `posted_at` carry invalid or missing timezone offsets.**
   - *Result*: **Fine**. All timestamps in `/v1/listings`, `/v1/rentals`, and `/health` follow ISO 8601 UTC / explicit +05:30 offsets cleanly without parsing errors.

4. **Hypothesis: Pagination `page` parameter is 0-indexed rather than 1-indexed.**
   - *Result*: **Fine**. `page=1` returns page 1, and `page=0` or negative pages throw validation errors.

---

## What We Would Do With Another Two Days

1. **MongoDB Database Integration**:
   - Currently, user saved favourites are synced across localStorage and Express in-memory state. With another two days, we would wire up a live MongoDB Atlas cluster via Mongoose for persistent cross-device user sync.

2. **Real-time Map Visualizer (Leaflet / Mapbox)**:
   - Integrate an interactive map view on the Listings & Projects screens plotting property coordinate pins (`latitude`, `longitude`) with locality cluster boundaries.

3. **Automated End-to-End Test Suite**:
   - Implement Playwright E2E tests validating the login flow, filter interactions, detail navigation, and favourites persistence across browsers.

---

## Vercel Deployment Instructions

1. Push code to GitHub repository: `https://github.com/namankhanduja/ivy-homes-assignment`.
2. Connect repository on Vercel Dashboard.
3. Vercel automatically detects `vercel.json` and builds both the static React frontend (`dist`) and Express API handlers (`api/index.js`).
